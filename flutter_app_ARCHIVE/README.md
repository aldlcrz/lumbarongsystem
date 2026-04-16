# LumBarong Flutter App

Mobile app (Android & iOS) for the LumBarong marketplace. Same features and design as the web app; uses the existing Node/Express backend API.

## Requirements

- Flutter SDK (stable)
- Backend running at `http://localhost:5000` (or set `kApiBaseUrl` in `lib/config/api_config.dart`)

## API base URL

- **Android emulator:** `http://10.0.2.2:5000/api/v1` (default in `lib/config/api_config.dart`)
- **iOS simulator:** `http://localhost:5000/api/v1` (change in `api_config.dart` if needed)
- **Physical device:** Use your machine’s LAN IP, e.g. `http://192.168.1.x:5000/api/v1`

## Run

```bash
cd lumbarong/flutter_app
flutter pub get
flutter run
```

- **Android:** `flutter run` (device/emulator)
- **iOS:** `flutter run` (simulator or device)

## Features (aligned with web)

- Landing, login, register (customer / artisan)
- Home: product list, category filter
- Product detail: view, add to cart
- Cart and checkout (GCash/COD, receipt upload)
- Orders list
- Messages, Heritage Guide, About (stub screens)
- Seller: dashboard, orders, inventory, add product (stub screens)
- Admin: dashboard, sellers, products, settings (stub screens)
- Auth and cart persisted (shared_preferences)

## Project structure

- `lib/config/` – API base URL, app theme
- `lib/models/` – User, Product, Order, CartItem
- `lib/providers/` – AuthProvider, CartProvider
- `lib/screens/` – All screens and `widgets/` (navbar, footer, product card)
- `lib/services/` – ApiClient (Dio + x-auth-token)
