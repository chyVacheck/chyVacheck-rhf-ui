# chyvacheck-rhf-ui

**UI-библиотека для React**, объединяющая [React Hook Form](https://react-hook-form.com/) и [shadcn/ui](https://ui.shadcn.com/) компоненты в единую систему с типобезопасными полями и единым стилем.

---

## 🚀 Установка

```bash
bun add chyvacheck-rhf-ui react-hook-form zod
# или
npm install chyvacheck-rhf-ui react-hook-form zod
```

---

## 🧩 Использование

### Пример базовой формы

```tsx
import { Form, Fields } from "chyvacheck-rhf-ui";

export function ExampleForm() {
  return (
    <Form onSubmit={console.log}>
      <Fields.RHFTextField name="email" label="Email" />
      <Fields.RHFPasswordField name="password" label="Password" />
      <Fields.RHFCheckbox name="remember" label="Remember me" />
    </Form>
  );
}
```

---

## 📁 Структура экспорта

| Модуль                          | Назначение                                 |
| ------------------------------- | ------------------------------------------ |
| `chyvacheck-rhf-ui`             | Главный экспорт (`Form`, `Fields`)         |
| `chyvacheck-rhf-ui/form`        | Базовые компоненты формы                   |
| `chyvacheck-rhf-ui/form/fields` | Поля (`RHFTextField`, `RHFSelect`, и т.д.) |
| `chyvacheck-rhf-ui/form/parts`  | Части формы (`FieldLabel`, `FieldError`)   |

Пример импорта отдельных частей:

```tsx
import { RHFTextField } from "chyvacheck-rhf-ui/form/fields";
import { FieldError } from "chyvacheck-rhf-ui/form/parts";
```

---

## ⚙️ Peer dependencies

Библиотека использует и ожидает, что следующие пакеты будут установлены в вашем проекте:

- `react` >= 18
- `react-dom` >= 18
- `react-hook-form` >= 7
- `zod` >= 3
- `@radix-ui/react-*`
- `class-variance-authority`
- `tailwind-merge`
- `lucide-react`
- `react-day-picker`

---

## 🧱 Технологии

- ⚛️ React 18+
- 🪄 React Hook Form
- 💅 shadcn/ui (Radix + Tailwind)
- 🧩 TypeScript + tsup
- 🧠 Zod для валидации

---

## 📦 Публикация

1. Соберите библиотеку:
   ```bash
   bun run build
   ```
2. Опубликуйте в npm:
   ```bash
   npm publish --access public
   ```

---

## 🪪 Лицензия

MIT © [Dmytro Shakh](https://github.com/chyvacheck)

---

> 🌟 **chyvacheck-rhf-ui** — гибкая, типобезопасная библиотека форм, идеально подходящая для интеграции с любыми проектами на React.
