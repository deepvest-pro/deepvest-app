# План рефакторинга проекта DeepVest

## 1. API Routes - Унификация обработки ошибок и CORS

### Проблема

Повторяющийся код в каждом API роуте для:

- CORS headers
- Обработка ошибок
- Валидация аутентификации
- Проверка разрешений

### Решение

#### 1.1 Создать базовые middleware

```typescript
// src/lib/api/middleware/cors.ts
export const corsMiddleware = () => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS',
});

// src/lib/api/middleware/auth.ts
export async function requireAuth(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new APIError('Authentication required', 401);
  }

  return user;
}

// src/lib/api/middleware/project-permissions.ts
export async function requireProjectPermission(
  userId: string,
  projectId: string,
  role: ProjectRole = 'viewer',
) {
  const hasAccess = await checkUserProjectRole(userId, projectId, role);
  if (!hasAccess) {
    throw new APIError('Insufficient permissions', 403);
  }
}
```

#### 1.2 Создать базовый обработчик API

```typescript
// src/lib/api/base-handler.ts
export class APIError extends Error {
  constructor(
    public message: string,
    public status: number = 500,
  ) {
    super(message);
  }
}

export function createAPIHandler<T = any>(
  handler: (request: NextRequest, params?: any) => Promise<T>,
) {
  return async (request: NextRequest, context?: any) => {
    const startTime = Date.now();

    try {
      // Handle CORS
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsMiddleware() });
      }

      const result = await handler(request, context?.params);

      return NextResponse.json({ success: true, data: result }, { headers: corsMiddleware() });
    } catch (error) {
      console.error('API Error:', error);

      const status = error instanceof APIError ? error.status : 500;
      const message = error instanceof Error ? error.message : 'Unknown error';

      return NextResponse.json(
        {
          success: false,
          error: message,
          metadata: { processingTime: Date.now() - startTime },
        },
        { status, headers: corsMiddleware() },
      );
    }
  };
}
```

#### 1.3 Рефакторинг API routes

```typescript
// Пример: src/app/api/projects/[id]/route.ts
export const GET = createAPIHandler(async (request, params) => {
  const { id: projectId } = await params;

  const { data: project, error } = await getProjectWithDetails(projectId);
  if (error || !project) {
    throw new APIError(error || 'Project not found', 404);
  }

  const { data: documents } = await getPublicProjectDocuments(projectId);
  const { data: team } = await getPublicProjectTeamMembers(projectId);

  return { project, documents, team };
});

export const PUT = createAPIHandler(async (request, params) => {
  const user = await requireAuth(request);
  const { id: projectId } = await params;

  await requireProjectPermission(user.id, projectId, 'editor');

  const json = await request.json();
  const validatedData = updateProjectSchema.omit({ id: true }).parse(json);

  const { data, error } = await updateProject(projectId, validatedData);
  if (error || !data) {
    throw new APIError(error || 'Failed to update project', 500);
  }

  return { project: data };
});
```

## 2. Компоненты форм - Устранение дублирования

### Проблема

Повторяющийся код для:

- Стилизованные input/textarea компоненты
- Обработка ошибок форм
- Состояния загрузки

### Решение

#### 2.1 Создать базовые компоненты форм

```typescript
// src/components/forms/FormField.tsx
interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  icon?: React.ComponentType<{ width: string; height: string; color: string }>;
  children: React.ReactNode;
}

export function FormField({ id, label, error, icon: Icon, children }: FormFieldProps) {
  return (
    <Box mb="3">
      <Flex gap="2" mb="1" align="center">
        {Icon && <Icon width="16" height="16" color="var(--gray-8)" />}
        <Text as="label" htmlFor={id} size="2" weight="medium">
          {label}
        </Text>
      </Flex>
      {children}
      {error && (
        <Text size="1" color="red" mt="1">
          {error}
        </Text>
      )}
    </Box>
  );
}

// src/components/forms/StyledInput.tsx
interface StyledInputProps {
  id: string;
  type?: string;
  placeholder: string;
  disabled?: boolean;
  register: UseFormRegister<any>;
  error?: FieldError;
  icon?: React.ComponentType<any>;
  label: string;
}

export function StyledInput({
  id, type = 'text', placeholder, disabled, register, error, icon, label
}: StyledInputProps) {
  return (
    <FormField id={id} label={label} error={error?.message} icon={icon}>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 'var(--radius-2)',
          border: '1px solid var(--gray-6)',
          fontSize: '14px',
        }}
        {...register(id)}
      />
    </FormField>
  );
}
```

#### 2.2 Унифицировать обработку форм

```typescript
// src/hooks/useFormHandler.ts
interface UseFormHandlerProps<T> {
  schema: z.ZodSchema<T>;
  onSubmit: (data: T) => Promise<{ success?: boolean; error?: string }>;
  onSuccess?: () => void;
}

export function useFormHandler<T>({ schema, onSubmit, onSuccess }: UseFormHandlerProps<T>) {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error: toastError } = useToastHelpers();

  const form = useForm<T>({
    resolver: zodResolver(schema),
  });

  const handleSubmit = form.handleSubmit(async (data: T) => {
    setIsLoading(true);
    try {
      const result = await onSubmit(data);

      if (result.error) {
        toastError(result.error);
      } else {
        success('Operation completed successfully!');
        onSuccess?.();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      toastError(message);
    } finally {
      setIsLoading(false);
    }
  });

  return {
    ...form,
    handleSubmit,
    isLoading,
  };
}
```

## 3. Supabase клиенты - Унификация

### Проблема

Дублирование логики создания Supabase клиентов и обработки ошибок

### Решение

#### 3.1 Создать фабрику клиентов

```typescript
// src/lib/supabase/client-factory.ts
export class SupabaseClientFactory {
  private static serverClient: Promise<SupabaseClient> | null = null;

  static async getServerClient(): Promise<SupabaseClient> {
    if (!this.serverClient) {
      this.serverClient = this.createServerClient();
    }
    return this.serverClient;
  }

  private static async createServerClient(): Promise<SupabaseClient> {
    const cookieStore = await cookies();
    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: cookiesToSet => {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                try {
                  cookieStore.set(name, value, options);
                } catch {
                  // Silent fail in Server Components
                }
              });
            } catch {
              // Silent fail
            }
          },
        },
      },
    );
  }

  static clearCache() {
    this.serverClient = null;
  }
}

// Обновить экспорт
export const createSupabaseServerClient = SupabaseClientFactory.getServerClient;
```

#### 3.2 Создать базовый репозиторий

```typescript
// src/lib/supabase/base-repository.ts
export abstract class BaseRepository<T = any> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  protected async getClient() {
    return SupabaseClientFactory.getServerClient();
  }

  async findById(id: string): Promise<{ data: T | null; error: string | null }> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase.from(this.tableName).select('*').eq('id', id).single();

      return { data, error: error?.message || null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async create(data: Partial<T>): Promise<{ data: T | null; error: string | null }> {
    try {
      const supabase = await this.getClient();
      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single();

      return { data: result, error: error?.message || null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Добавить остальные CRUD методы...
}
```

## 4. Validation - Централизация схем

### Проблема

Разбросанные схемы валидации и дублирование правил

### Решение

#### 4.1 Создать центральное хранилище схем

```typescript
// src/lib/validations/index.ts
export const ValidationSchemas = {
  // User schemas
  user: {
    signIn: signInSchema,
    signUp: signUpSchema,
    profile: profileUpdateSchema,
  },

  // Project schemas
  project: {
    create: createProjectSchema,
    update: updateProjectSchema,
    snapshot: snapshotSchema,
  },

  // Team schemas
  team: {
    create: createTeamMemberSchema,
    update: updateTeamMemberSchema,
    bulk: bulkTeamMemberSchema,
  },

  // Common field validators
  common: {
    email: z.string().email('Please enter a valid email'),
    url: z.string().url('Please enter a valid URL'),
    slug: z
      .string()
      .min(3, 'Must be at least 3 characters')
      .max(63, 'Must be less than 63 characters')
      .regex(/^[a-z0-9-]+$/, 'Can only contain lowercase letters, numbers, and hyphens'),
    uuid: z.string().uuid('Invalid ID format'),
  },
} as const;

// Utility functions
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): {
  success: boolean;
  data?: T;
  errors?: string[];
} {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: result.error.errors.map(err => err.message),
  };
}
```

## 5. Утилиты и хелперы - Реорганизация

### Проблема

Разбросанные утилитарные функции в разных файлах

### Решение

#### 5.1 Создать структурированные утилиты

```typescript
// src/lib/utils/index.ts - Единая точка входа
export * from './format';
export * from './validation';
export * from './file';
export * from './social';
export * from './api';

// src/lib/utils/api.ts - API утилиты
export class APIClient {
  private static baseUrl = '/api';

  static async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<{ data: T | null; error: string | null }> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const result = await response.json();

      if (!response.ok) {
        return { data: null, error: result.error || 'Request failed' };
      }

      return { data: result.data || result, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  static async get<T>(endpoint: string): Promise<{ data: T | null; error: string | null }> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  static async post<T>(
    endpoint: string,
    data: any,
  ): Promise<{ data: T | null; error: string | null }> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Добавить put, delete методы...
}
```

#### 5.2 Унифицировать утилиты форматирования

```typescript
// src/lib/utils/format.ts - Расширить существующий файл
export const formatters = {
  date: (dateString: string, format: 'short' | 'long' | 'relative' = 'long') => {
    const date = new Date(dateString);

    switch (format) {
      case 'short':
        return date.toLocaleDateString();
      case 'relative':
        return formatDistanceToNow(date, { addSuffix: true });
      default:
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
    }
  },

  currency: (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  },

  percentage: (value: number, decimals = 1) => {
    return `${value.toFixed(decimals)}%`;
  },

  fileSize: (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
};
```

## 6. Types - Оптимизация

### Проблема

Слишком большой файл types/supabase.ts с дублированием типов

### Решение

#### 6.1 Разделить типы по модулям

```typescript
// src/types/index.ts
export * from './auth';
export * from './project';
export * from './team';
export * from './scoring';
export * from './api';

// src/types/common.ts
export type UUID = string;
export type Timestamp = string;

export interface BaseEntity {
  id: UUID;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    processingTime?: number;
    [key: string]: any;
  };
}

// src/types/project.ts
export interface Project extends BaseEntity {
  slug: string;
  public_snapshot_id: UUID | null;
  new_snapshot_id: UUID | null;
  is_public: boolean;
  is_demo: boolean;
  is_archived: boolean;
}

export interface ProjectWithDetails extends Project {
  public_snapshot?: SnapshotWithAuthorAndScoring | null;
  new_snapshot?: SnapshotWithAuthorAndScoring | null;
  permissions?: ProjectPermission[];
}
```

## 7. Хуки - Унификация состояния

### Проблема

Дублирование логики в React хуках

### Решение

#### 7.1 Создать базовые хуки

```typescript
// src/hooks/useApiQuery.ts
export function useApiQuery<T>(
  endpoint: string,
  options: {
    enabled?: boolean;
    refetchOnMount?: boolean;
    staleTime?: number;
  } = {},
) {
  return useQuery({
    queryKey: [endpoint],
    queryFn: () => APIClient.get<T>(endpoint),
    enabled: options.enabled ?? true,
    refetchOnMount: options.refetchOnMount ?? false,
    staleTime: options.staleTime ?? 5 * 60 * 1000, // 5 минут
  });
}

// src/hooks/useApiMutation.ts
export function useApiMutation<TData, TVariables>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE' = 'POST',
  options: {
    onSuccess?: (data: TData) => void;
    onError?: (error: string) => void;
  } = {},
) {
  const { success, error: toastError } = useToastHelpers();

  return useMutation({
    mutationFn: (variables: TVariables) => {
      switch (method) {
        case 'POST':
          return APIClient.post<TData>(endpoint, variables);
        case 'PUT':
          return APIClient.put<TData>(endpoint, variables);
        case 'DELETE':
          return APIClient.delete<TData>(endpoint);
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    },
    onSuccess: result => {
      if (result.error) {
        toastError(result.error);
        options.onError?.(result.error);
      } else {
        success('Operation completed successfully!');
        options.onSuccess?.(result.data!);
      }
    },
    onError: (error: Error) => {
      toastError(error.message);
      options.onError?.(error.message);
    },
  });
}
```

## 8. Константы и конфигурация

### Проблема

Магические числа и строки разбросаны по коду

### Решение

#### 8.1 Централизовать константы

```typescript
// src/lib/constants/index.ts
export const APP_CONFIG = {
  name: 'DeepVest',
  description: 'A modern investment platform for project funding',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  pagination: {
    defaultLimit: 10,
    maxLimit: 100,
  },

  files: {
    maxSizes: {
      avatar: 2 * 1024 * 1024, // 2MB
      cover: 5 * 1024 * 1024, // 5MB
      document: 10 * 1024 * 1024, // 10MB
    },

    acceptedTypes: {
      images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      documents: ['application/pdf', 'application/msword'],
    },
  },

  timeouts: {
    api: 30000, // 30 seconds
    upload: 120000, // 2 minutes
  },
} as const;

// src/lib/constants/routes.ts
export const ROUTES = {
  home: '/',
  auth: {
    signIn: '/auth/sign-in',
    signUp: '/auth/sign-up',
    resetPassword: '/auth/reset-password',
  },
  projects: {
    list: '/projects',
    new: '/projects/new',
    detail: (id: string) => `/projects/${id}`,
    edit: (id: string) => `/projects/${id}/edit`,
  },
  api: {
    projects: '/api/projects',
    project: (id: string) => `/api/projects/${id}`,
    teamMembers: (projectId: string) => `/api/projects/${projectId}/team-members`,
  },
} as const;
```
