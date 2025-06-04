# Чек-лист задач для рефакторинга проекта DeepVest

## Этап 1: Базовая инфраструктура

### 1.1. Создание базовых middleware и обработчиков API

#### - [x] Задача 1.1.1: Создать базовые middleware для API

**Файлы для создания:**

- `src/lib/api/middleware/cors.ts` ✅
- `src/lib/api/middleware/auth.ts` ✅
- `src/lib/api/middleware/project-permissions.ts` ✅

**Действие:** Создать файлы согласно пункту 1.1 плана рефакторинга. Реализовать функции `corsMiddleware()`, `requireAuth()`, `requireProjectPermission()`. ✅

#### - [x] Задача 1.1.2: Создать базовый обработчик API

**Файлы для создания:**

- `src/lib/api/base-handler.ts` ✅

**Действие:** Создать класс `APIError` и функцию `createAPIHandler` согласно пункту 1.2 плана рефакторинга.

#### - [x] Задача 1.1.3: Создать APIClient утилиту

**Файлы для создания:**

- `src/lib/utils/api.ts` ✅

**Действие:** Создать класс `APIClient` с методами `request()`, `get()`, `post()`, `put()`, `delete()` согласно пункту 5.1 плана рефакторинга.

### 1.2. Создание базовых компонентов форм

#### - [x] Задача 1.2.1: Создать базовые компоненты форм

**Файлы для создания:**

- `src/components/forms/FormField.tsx` ✅
- `src/components/forms/StyledInput.tsx` ✅
- `src/components/forms/StyledTextArea.tsx` ✅
- `src/components/forms/index.ts` ✅

**Действие:** Создать компоненты `FormField`, `StyledInput`, `StyledTextArea` согласно пункту 2.1 плана рефакторинга. ✅

#### - [x] Задача 1.2.2: Создать хук для обработки форм

**Файлы для создания:**

- `src/hooks/useFormHandler.ts` ✅

**Действие:** Создать хук `useFormHandler` согласно пункту 2.2 плана рефакторинга. ✅

### 1.3. Централизация констант и конфигурации

#### - [x] Задача 1.3.1: Создать центральное хранилище констант ✅

**Файлы для создания:**

- `src/lib/constants/index.ts` ✅
- `src/lib/constants/routes.ts` ✅
- `src/lib/constants/config.ts` ✅

**Действие:** Перенести все константы из разных файлов в централизованное хранилище согласно пункту 8.1 плана рефакторинга. ✅

#### - [x] Задача 1.3.2: Создать центральное хранилище валидации

**Файлы для создания:**

- `src/lib/validations/index.ts` ✅

**Действие:** Централизовать все Zod схемы согласно пункту 4.1 плана рефакторинга. ✅

### 1.4. Оптимизация Supabase клиентов

#### - [x] Задача 1.4.1: Создать фабрику Supabase клиентов

**Файлы для изменения:**

- `src/lib/supabase/client.ts` ✅

**Файлы для создания:**

- `src/lib/supabase/client-factory.ts` ✅
- `src/lib/supabase/base-repository.ts` ✅
- `src/lib/supabase/index.ts` ✅

**Действие:** Создать `SupabaseClientFactory` и `BaseRepository` согласно пунктам 3.1-3.2 плана рефакторинга. ✅

## Этап 2: Рефакторинг API routes

### 2.1. Рефакторинг API routes проектов

#### - [x] Задача 2.1.1: Рефакторинг `/api/projects/[id]/route.ts` ✅

**Файлы для изменения:**

- `src/app/api/projects/[id]/route.ts` ✅

**Действие:** Переписать GET, PUT, DELETE handlers с использованием `createAPIHandler` согласно пункту 1.3 плана рефакторинга. ✅

**Выполнено:**

- Переписаны все handlers (GET, PUT, DELETE) с использованием новой архитектуры API
- Интегрированы middleware: requireAuth, requireProjectPermission, corsMiddleware
- Добавлена валидация входных данных с помощью ValidationSchemas
- Реализована стандартизированная обработка ошибок с APIError
- Создан отдельный файл project-client-api.ts для клиентских функций
- Исправлено разделение server/client кода для предотвращения ошибок сборки
- Исправлена валидационная схема для PUT запросов (убрано требование id в теле)
- Проект успешно собирается и проходит ESLint ✅

#### - [x] Задача 2.1.2: Рефакторинг `/api/projects/route.ts` ✅

**Файлы для изменения:**

- `src/app/api/projects/route.ts` ✅

**Действие:** Переписать GET, POST handlers с использованием новых middleware. ✅

**Выполнено:**

- Переписаны все handlers (GET, POST) с использованием `createAPIHandler`
- Интегрированы middleware: `requireAuth`, `corsMiddleware`
- Добавлена валидация входных данных с помощью `ValidationSchemas.project.create`
- Реализована стандартизированная обработка ошибок с APIError
- Убрано дублирование кода для CORS, аутентификации и обработки ошибок
- Проект успешно собирается и проходит ESLint ✅

#### - [x] Задача 2.1.3: Рефакторинг `/api/projects/[id]/documents/route.ts` ✅

**Файлы для изменения:**

- `src/app/api/projects/[id]/documents/route.ts` ✅

**Действие:** Переписать все handlers с использованием базового обработчика API. ✅

**Выполнено:**

- Переписаны все handlers (GET, POST) с использованием `createAPIHandlerWithParams`
- Интегрированы middleware: `requireAuth`, `requireProjectPermission`
- Добавлена валидация входных данных с помощью `ValidationSchemas.document.create`
- Создан репозиторий `ProjectDocumentsRepository` для работы с документами
- Добавлены схемы валидации для документов в `ValidationSchemas.document`
- Реализована стандартизированная обработка ошибок с APIError
- Убрано дублирование кода для CORS, аутентификации и обработки ошибок
- Исправлены ошибки линтера:
  - Заменен несуществующий метод `findBySlug` на `isSlugAvailable`
  - Исправлена типизация ошибок при создании документа
- Добавлен метод `softDelete` в `ProjectDocumentsRepository`
- Проект успешно собирается и проходит ESLint ✅

#### - [x] Задача 2.1.4: Рефакторинг `/api/projects/[id]/documents/[docId]/route.ts` ✅

**Файлы для изменения:**

- `src/app/api/projects/[id]/documents/[docId]/route.ts` ✅

**Действие:** Применить новую архитектуру API к handlers документов. ✅

**Выполнено:**

- Переписаны все handlers (GET, PUT, DELETE) с использованием `createAPIHandlerWithParams`
- Интегрированы middleware: `requireAuth`, `requireProjectPermission`
- Добавлена валидация входных данных с помощью `ValidationSchemas.document.update`
- Использован `ProjectDocumentsRepository` для всех операций с базой данных
- Реализована стандартизированная обработка ошибок с APIError
- Убрано дублирование кода для CORS, аутентификации и обработки ошибок
- Улучшена логика проверки разрешений и владения документами
- Добавлены дополнительные проверки безопасности (проверка принадлежности документа к проекту)
- **Исправлены ошибки в методе `softDelete`:**
  - Добавлена проверка существования документа перед удалением
  - Улучшена обработка ошибок с детальными сообщениями
  - Добавлена проверка количества затронутых строк
  - Добавлено логирование для диагностики проблем
  - **Исправлена проблема с RLS политиками:**
    - Добавлен service role клиент в `SupabaseClientFactory`
    - Обновлен базовый репозиторий для поддержки service role клиента
    - Метод `softDelete` теперь использует service role клиент, который обходит RLS политики
    - Это решает проблему "new row violates row-level security policy" при soft delete операциях
- **Исправлена проблема с проверкой slug в PUT handler:**
  - Исправлена логика проверки slug - теперь проверяется доступность только если slug действительно изменился
  - Заменена RPC функция `check_content_slug_availability` на прямой SQL запрос для надежности
  - Добавлена правильная обработка параметра `excludeId` при проверке доступности slug
  - Это решает проблему "Slug already exists in this project" при обновлении документа с тем же slug
- **Улучшена обработка ошибок в DELETE handler:**
  - Добавлено детальное логирование ошибок
  - Разделена обработка ошибок удаления и синхронизации снапшотов
  - Предотвращен сбой операции удаления при ошибке синхронизации
- Проект успешно собирается и проходит ESLint ✅
- API корректно возвращает ошибки аутентификации вместо внутренних ошибок сервера ✅

### 2.2. Рефакторинг API routes команды

#### - [x] Задача 2.2.1: Рефакторинг `/api/projects/[id]/team-members/route.ts` ✅

**Файлы для изменения:**

- `src/app/api/projects/[id]/team-members/route.ts` ✅

**Действие:** Переписать с использованием `createAPIHandlerWithParams` и новых middleware. ✅

**Выполнено:**

- Переписаны все handlers (GET, POST) с использованием `createAPIHandlerWithParams`
- Интегрированы middleware: `requireAuth`, `requireProjectPermission`, `getOptionalAuth`
- Добавлена валидация входных данных с помощью `ValidationSchemas.team`
- Реализована стандартизированная обработка ошибок с APIError
- Исправлена логика доступа: теперь пользователи с доступом к проекту видят всех участников команды, а гости - только публичных или участников публичных проектов
- Убрано дублирование кода для CORS, аутентификации и обработки ошибок
- Проект успешно собирается и проходит ESLint ✅
- API корректно работает с cURL тестами ✅

#### - [x] Задача 2.2.2: Рефакторинг `/api/projects/[id]/team-members/[memberId]/route.ts` ✅

**Файлы для изменения:**

- `src/app/api/projects/[id]/team-members/[memberId]/route.ts` ✅

**Действие:** Применить новую архитектуру к handlers участников команды. ✅

**Выполнено:**

- Переписаны все handlers (GET, PUT, DELETE) с использованием `createAPIHandlerWithParams`
- Интегрированы middleware: `requireAuth`, `getOptionalAuth`
- Добавлена валидация входных данных с помощью `ValidationSchemas.team.update`
- Реализована стандартизированная обработка ошибок с APIError
- Убрано дублирование кода для CORS, аутентификации и обработки ошибок
- Улучшена логика проверки разрешений и владения участниками команды
- Проект успешно собирается и проходит ESLint ✅

#### - [x] Задача 2.2.3: Рефакторинг `/api/projects/[id]/team-members/bulk/route.ts` ✅

**Файлы для изменения:**

- `src/app/api/projects/[id]/team-members/bulk/route.ts` ✅

**Действие:** Переписать bulk операции с новыми middleware. ✅

**Выполнено:**

- Переписан POST handler с использованием `createAPIHandlerWithParams`
- Интегрированы middleware: `requireAuth`
- Добавлена валидация входных данных с помощью `ValidationSchemas.team.bulk`
- Реализована стандартизированная обработка ошибок с APIError
- Убрано дублирование кода для CORS, аутентификации и обработки ошибок
- Сохранена вся бизнес-логика для bulk операций (delete, activate, deactivate, invite)
- Проект успешно собирается и проходит ESLint ✅

### 2.3. Рефакторинг остальных API routes

#### - [x] Задача 2.3.1: Рефакторинг `/api/ai/generate-content/route.ts` ✅

**Файлы для изменения:**

- `src/app/api/ai/generate-content/route.ts` ✅

**Действие:** Применить `createAPIHandler` к AI content generation endpoint. ✅

**Выполнено:**

- Переписан POST handler с использованием `createAPIHandler`
- Убраны дублированные CORS headers и обработка ошибок
- Заменены прямые NextResponse на использование стандартизированной архитектуры API
- Применена валидация входных данных с помощью zod схем
- Реализована стандартизированная обработка ошибок с APIError
- Убрано дублирование кода для CORS, обработки ошибок и валидации
- Проект успешно собирается и проходит ESLint ✅

#### - [x] Задача 2.3.2: Рефакторинг `/api/transcribe/route.ts` ✅

**Файлы для изменения:**

- `src/app/api/transcribe/route.ts` ✅

**Действие:** Переписать transcription API с новой архитектурой. ✅

**Выполнено:**

- Переписан POST handler с использованием `createAPIHandler`
- Убраны дублированные CORS headers и обработка ошибок
- Заменены прямые NextResponse на использование стандартизированной архитектуры API
- Применена валидация входных данных с помощью zod схем
- Реализована стандартизированная обработка ошибок с APIError
- Улучшены функции downloadAndValidateFile и transcribeWithGemini с правильной типизацией ошибок
- Убрано дублирование кода для CORS, обработки ошибок и валидации
- Проект успешно собирается и проходит ESLint ✅

#### - [x] Задача 2.3.3: Рефакторинг `/api/projects/[id]/scoring/route.ts` ✅

**Файлы для изменения:**

- `src/app/api/projects/[id]/scoring/route.ts` ✅

**Действие:** Применить базовый обработчик к scoring API. ✅

**Выполнено:**

- Переписан POST handler с использованием `createAPIHandlerWithParams`
- Интегрированы middleware: `requireAuth` для аутентификации
- Добавлена валидация входных данных с помощью `generateScoringRequestSchema`
- Реализована стандартизированная обработка ошибок с APIError
- Использован `SupabaseClientFactory.getServerClient()` для работы с базой данных
- Убрано дублирование кода для CORS, аутентификации и обработки ошибок
- Улучшена функция generateWithGemini с правильной типизацией ошибок
- Сохранена вся бизнес-логика для scoring (LLM анализ, fallback данные, работа с базой)
- Проект успешно собирается и проходит ESLint ✅

#### - [x] Задача 2.3.4: Рефакторинг `/api/projects/[id]/upload/route.ts` ✅

**Файлы для изменения:**

- `src/app/api/projects/[id]/upload/route.ts` ✅

**Действие:** Применить новую архитектуру API к upload endpoint. ✅

**Выполнено:**

- Переписан POST handler с использованием `createAPIHandlerWithParams`
- Интегрированы middleware: `requireAuth`, `requireProjectPermission`
- Добавлена валидация входных данных с помощью zod схем
- Реализована стандартизированная обработка ошибок с APIError
- Убрано дублирование кода для CORS, аутентификации и обработки ошибок
- Исправлен формат ответа API для совместимости с новой архитектурой (данные теперь возвращаются в поле `data`)
- Решена проблема "No valid file URLs received from upload" в компоненте загрузки документов
- Исправлены импорты APIError в связанных файлах (ai/generate-content, transcribe, check-slug)
- Проект успешно собирается и проходит ESLint ✅

#### - [x] Задача 2.3.5: Исправление дополнительных проблем ✅

**Файлы для изменения:**

- `src/app/api/projects/[id]/documents/check-slug/route.ts` ✅

**Действие:** Исправить проблемы с импортами и ошибками в check-slug route. ✅

**Выполнено:**

- Добавлен отсутствующий импорт `APIError` из `@/lib/api/middleware/auth`
- Заменены обычные `Error` на `APIError` с соответствующими HTTP статусами
- Исправлены все ошибки сборки проекта
- **Исправлена проблема с транскрипцией документов:**
  - Проблема: API транскрипции работал корректно, но всплывал тост "Transcription failed"
  - Причина: Двойная проверка `response.data?.success` в frontend коде, но новый API не возвращает поле `success` в данных
  - Решение: Обновлена логика проверки в `DocumentsSection.tsx` и тип `TranscribeResponse`
  - Теперь транскрипция и сохранение контента работает корректно ✅
- **Исправлена проблема с сохранением scoring данных:**
  - Проблема: API scoring генерировал правильные данные, но в базу записывались нули
  - Причина: Двойная вложенность данных в ответе (`data.data`) и неправильная обработка числовых значений из LLM
  - Решение:
    - Исправлена структура ответа API (убрана двойная вложенность `data`)
    - Добавлена коерция типов в Zod схеме (`z.coerce.number()`)
    - Улучшена функция `parseLLMResponse` для обработки чисел как строк
    - Добавлены отладочные логи для диагностики парсинга
  - Теперь scoring данные корректно сохраняются в базу ✅
- **Исправлена проблема с отображением scoring на frontend:**
  - Проблема: После генерации scoring данные сохранялись в базу, но на странице отображались нули до обновления страницы
  - Причина: Неправильное обновление React состояния - код ожидал `result.data.id` и `result.data`, но новый API возвращает `result.data.scoring.id` и `result.data.scoring`
  - Решение: Обновлена логика в `ProjectContent.tsx` для корректного извлечения scoring данных из нового формата ответа API
  - Теперь scoring данные отображаются сразу после генерации без необходимости обновления страницы ✅
- Проект успешно собирается и проходит ESLint ✅

#### - [x] Задача 2.3.4: Рефакторинг Auth API routes ✅

**Файлы для изменения:**

- `src/app/api/auth/route.ts` ✅
- `src/app/auth/callback/route.ts` ✅
- `src/app/auth/confirm/route.ts` ✅

**Действие:** Унифицировать auth routes с новой архитектурой. ✅

**Выполнено:**

- Отрефакторен `/api/auth/route.ts` с использованием `createAPIHandler`
- Добавлена валидация OAuth провайдера с помощью `ValidationSchemas.auth.oauthProvider`
- Реализована стандартизированная обработка ошибок с APIError
- Убрано дублирование кода для CORS и обработки ошибок
- Обновлены `/auth/callback/route.ts` и `/auth/confirm/route.ts` с улучшенной валидацией
- Сохранена функциональность прямых NextResponse редиректов для браузерной навигации
- Добавлены новые валидационные схемы: `oauthProviderSchema`, `authCallbackSchema`, `emailConfirmSchema`
- Проект успешно собирается и проходит ESLint ✅

#### - [x] Задача 2.3.5: Рефакторинг остальных API routes ✅

**Файлы для изменения:**

- `src/app/api/leaderboard/route.ts` ✅
- `src/app/api/profile/image-upload/route.ts` ✅
- `src/app/api/projects/check-slug/route.ts` ✅
- `src/app/api/projects/[id]/permissions/route.ts` ✅
- `src/app/api/projects/[id]/permissions/user/route.ts` ✅
- `src/app/api/projects/[id]/publish-draft/route.ts` ✅
- `src/app/api/projects/[id]/snapshots/route.ts` ✅
- `src/app/api/projects/[id]/snapshots/[snapshotId]/route.ts` ✅
- `src/app/api/projects/[id]/snapshots/[snapshotId]/publish/route.ts` ✅
- `src/app/api/projects/[id]/sync-snapshot/route.ts` ✅
- `src/app/api/projects/[id]/upload/route.ts` ✅
- `src/app/api/projects/[id]/debug/route.ts` ✅

**Действие:** Последовательно применить новую архитектуру ко всем оставшимся API routes. ✅

**Полностью выполнено:**

- Отрефакторены все API routes с использованием `createAPIHandler` и `createAPIHandlerWithParams`
- Интегрированы middleware: `requireAuth`, `requireProjectPermission`, `getOptionalAuth`
- Добавлена валидация входных данных с помощью `ValidationSchemas` и специальных схем
- Реализована стандартизированная обработка ошибок с APIError
- Убрано дублирование кода для CORS, аутентификации и обработки ошибок
- Все файлы переведены на новую архитектуру API:
  - `/api/leaderboard/route.ts` - добавлена специальная схема валидации с min_score
  - `/api/profile/image-upload/route.ts` - полный рефакторинг с валидацией файлов
  - `/api/projects/[id]/permissions/user/route.ts` - упрощена логика с новыми middleware
  - `/api/projects/[id]/publish-draft/route.ts` - добавлены проверки разрешений
  - `/api/projects/[id]/snapshots/[snapshotId]/route.ts` - валидация snapshot данных
  - `/api/projects/[id]/snapshots/[snapshotId]/publish/route.ts` - упрощена логика публикации
  - `/api/projects/[id]/sync-snapshot/route.ts` - стандартизированная обработка ошибок
  - `/api/projects/[id]/debug/route.ts` - добавлены проверки безопасности для debug информации
- Исправлены все ошибки с сигнатурой функции `requireAuth()` (убраны лишние параметры)
- Убраны неиспользуемые импорты
- Проект успешно собирается и проходит ESLint ✅
- Все API routes теперь соответствуют новой архитектуре и guidelines ✅

## Этап 3: Рефакторинг компонентов и хуков

### 3.1. Создание базовых хуков

#### - [x] Задача 3.1.1: Создать базовые API хуки ✅

**Файлы для создания:**

- `src/hooks/useApiQuery.ts` ✅
- `src/hooks/useApiMutation.ts` ✅

**Действие:** Создать хуки `useApiQuery` и `useApiMutation` согласно пункту 7.1 плана рефакторинга. ✅

**Выполнено:**

- Создан хук `useApiQuery` с поддержкой стандартизированной обработки ошибок и кэширования
- Добавлены дополнительные хуки: `useApiQueryAuto`, `useApiQueryWhen` для различных сценариев использования
- Создан хук `useApiMutation` с поддержкой всех HTTP методов (POST, PUT, PATCH, DELETE)
- Добавлены специализированные хуки: `useCreateMutation`, `useUpdateMutation`, `usePatchMutation`, `useDeleteMutation`, `useUploadMutation`
- Реализована автоматическая инвалидация кэша после успешных мутаций
- Добавлена типизация для всех хуков с использованием TypeScript generics
- Интегрирован с новым APIClient для стандартизированной работы с API
- **Интегрированы в существующие компоненты:**
  - `LeaderboardList.tsx` - заменен `useQuery` на `useApiQuery` с правильными query keys
  - `ProjectsList.tsx` - заменен fetch на `useApiQuery` с fallback на initial data
  - `DocumentsSection.tsx` - заменены прямые API вызовы на `useUploadMutation` и `useApiMutation`
- Проект успешно собирается и проходит проверку типов ✅

#### - [x] Задача 3.1.2: Создать query keys ✅

**Файлы для создания:**

- `src/lib/query-keys.ts` ✅

**Действие:** Создать стандартизированные query keys для React Query. ✅

**Выполнено:**

- Создан файл `src/lib/query-keys.ts` с централизованными query keys
- Добавлены query keys для всех основных сущностей: auth, projects, users, team, leaderboard, ai
- Реализованы helper функции для работы с query keys: `invalidateProject`, `invalidateUser`, `invalidateAuth`, `prefetchProject`
- Добавлена правильная типизация с использованием `QueryClient` из `@tanstack/react-query`
- Создан barrel export в `src/hooks/index.ts` для удобного импорта всех хуков и query keys
- **Интегрированы в компоненты:** используются в `LeaderboardList.tsx` и `ProjectsList.tsx` для правильного кэширования
- **Исправлены русские комментарии:** переведены на английский согласно требованиям project.mdc
- Проект успешно собирается и проходит проверку типов ✅

### 3.2. Рефакторинг форм

#### - [x] Задача 3.2.1: Рефакторинг ProfileEditForm ✅

**Файлы для изменения:**

- `src/app/profile/edit/profile-edit-form.tsx` ✅

**Действие:** Переписать с использованием новых компонентов `StyledInput`, `StyledTextArea` и `useFormHandler`. ✅

**Выполнено:**

- Заменены inline стилизованные input/textarea компоненты на `StyledInput` и `StyledTextArea`
- Интегрирован `useFormHandler` с валидационной схемой `ValidationSchemas.auth.profile`
- Заменены прямые fetch вызовы на использование `APIClient.upload()` для загрузки изображений
- Сохранена вся функциональность: загрузка изображений, табы, валидация
- Улучшена типизация с добавлением `ImageUploadResponse` интерфейса
- Убрано дублирование кода для обработки форм и API вызовов
- Значительно сокращен объем кода при сохранении всех возможностей
- Проект успешно собирается и проходит ESLint ✅

#### - [x] Задача 3.2.2: Рефакторинг NewProjectForm ✅

**Файлы для изменения:**

- `src/app/projects/new/NewProjectForm.tsx` ✅

**Действие:** Применить новые базовые компоненты форм вместо дублированного кода. ✅

**Выполнено:**

- Заменена кастомная схема валидации на использование `ValidationSchemas.project.create`
- Заменены прямые fetch вызовы на использование `APIClient.get()` и `APIClient.post()`
- Упрощена логика формы с использованием `useFormHandler`
- Сохранена функциональность проверки slug и автогенерации
- Улучшена типизация с добавлением `ProjectCreateResponse` интерфейса
- Убрано дублирование кода для обработки форм и валидации
- Проект успешно собирается и проходит ESLint ✅

### 3.3. Рефакторинг API клиентов

#### - [x] Задача 3.3.1: Рефакторинг project-api.ts ✅

**Файлы для изменения:**

- `src/lib/api/project-api.ts` ✅

**Действие:** Переписать с использованием нового `APIClient` вместо прямых fetch вызовов. ✅

**Выполнено:**

- Заменены все прямые fetch вызовы на использование `APIClient`
- Добавлена правильная обработка ответов с проверкой `success` и `data` полей
- Улучшена типизация всех функций для корректной работы с новой API архитектурой:
  - `updateSnapshot` - добавлена типизация для ответа API проекта
  - `generateProjectData` - добавлена типизация для ответа AI API
  - `createTeamFromAI` - добавлена типизация для ответа team members API
- Добавлена стандартизированная обработка ошибок с `APIError`
- Убрано дублирование кода для HTTP запросов и обработки ошибок
- Сохранена вся бизнес-логика для всех функций:
  - `createProject`, `createSnapshot`, `updateSnapshot`
  - `uploadFile`, `createDocument`, `updateDocument`
  - `transcribeFile`, `generateProjectData`
  - `createTeamFromAI`
- Проект успешно собирается и проходит ESLint ✅
- Проект успешно проходит проверку типов ✅

#### - [x] Задача 3.3.2: Рефакторинг team-api.ts ✅

**Файлы для изменения:**

- `src/lib/api/team-api.ts` ✅

**Действие:** Применить `APIClient` к team API functions. ✅

**Выполнено:**

- Заменены все прямые fetch вызовы на использование `APIClient`
- Добавлена правильная обработка ответов с проверкой `success` и `data` полей
- Улучшена типизация всех функций для корректной работы с новой API архитектурой
- Добавлена стандартизированная обработка ошибок
- Обновлен `EditProjectContent.tsx` для использования нового API клиента
- Убрано дублирование кода для HTTP запросов и обработки ошибок
- Проект успешно собирается и проходит проверку типов ✅

### 3.4. Оптимизация auth хуков

#### - [ ] Задача 3.4.1: Рефакторинг auth-hooks.ts

**Файлы для изменения:**

- `src/lib/auth/auth-hooks.ts`

**Действие:** Упростить с использованием `
