# АСУ «Мои Дома» Light — мобильное приложение (React Native / Expo)

Нативный клиент к backend АСУ «Мои Дома» Light (`https://asu-md-light.duckdns.org`).
Bundle id: `kz.synapse.asulight`. Темы оформления: **«Мой Дом 24»** (по умолчанию) и «АСУ Мои Дома» — переключаются в Профиле.

## Запуск для разработки (Mac не нужен)

```bash
npm install
npx expo start
```
На iPhone: установить **Expo Go** из App Store, отсканировать QR-код из терминала. Приложение работает с живым backend.

Адрес backend задаётся в `app.json` → `expo.extra.apiBaseUrl`.

## Сборка для TestFlight / App Store (облако EAS, Mac не нужен)

```bash
npm install -g eas-cli
eas login                                   # аккаунт expo.dev (бесплатный)
eas build --platform ios --profile preview  # сборка; при первом запуске EAS сам создаст сертификаты по Apple ID
eas submit --platform ios                   # загрузка в App Store Connect → TestFlight
```
Нужен аккаунт Apple Developer Program. Для production: `eas build --platform ios --profile production`.

## Структура

```
App.js                      — провайдеры (SafeArea, тема, авторизация) + навигация
src/api/client.js           — HTTP-клиент (fetch), токен в SecureStore
src/lib/auth.jsx            — контекст авторизации (login / logout / start)
src/lib/houseFields.js      — разбор полей getHouseById (как в веб-версии)
src/lib/format.js, dictionaries.js — форматирование и справочники (общие с веб-версией)
src/theme/md24.js, asu.js   — токены тем; src/theme/index.jsx — провайдер, переключение и FONT_SCALE (масштаб шрифтов, сейчас 1.2)
src/components/ui.jsx       — NavBar, Row, Card, Field, Input, Button, Sheet, Tag, состояния, иконки
src/hooks/useHousesList.js  — загрузка уровня, поиск, вкладки статуса УК, итоги
src/navigation/RootNavigator.jsx — таб-бар (Дома / Пользователи / Профиль) + стеки
src/screens/                — Login, Houses (все уровни), HouseCard, Users, UserEdit, Profile
```

Навигация по уровням: экран `Houses` push-ится на каждом уровне с параметрами `{ mark, crumbs }`;
назад — системный свайп или кнопка; чипы пути делают `pop` на нужную глубину.
Карточка дома открывается push-ем `HouseCard` с `buildId` и `mark` строки.

## Перед публикацией

- `assets/icon.png` — иконка 1024×1024 (сейчас сгенерированная заглушка в стиле темы; замените на утверждённую).
- Политика конфиденциальности — ссылка понадобится в App Store Connect (можно разместить на том же домене).
- Тестовый логин/пароль для ревьюеров Apple.
