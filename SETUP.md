# LumBarong Project Setup Guide

Follow these steps to run the LumBarong system on a new device.

## 1. Prerequisites
- **Node.js**: Installed on your system.
- **XAMPP**: Required for the MySQL backend.
- **Flutter SDK**: Required for the mobile application.

## 2. VS Code Extensions (CRITICAL)
For the project to run and display correctly in VS Code, install these extensions:
- **ESLint**: For code quality.
- **Tailwind CSS IntelliSense**: For frontend styling.
- **Dart**: Required for Flutter development.
- **Flutter**: Required for Flutter development.

> [!NOTE]
> If you see errors in `launch.json` like "debug type not recognized", it means the **Dart** and **Flutter** extensions are missing.

## 3. Initial Setup
Run these commands after cloning to a new device:

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

### Flutter App
```bash
cd flutter_app
flutter pub get
```

## 4. Running the System
1. **Database**: Open XAMPP and start MySQL and Apache. Ensure your `lumbarong` database is imported.
2. **Backend**: Open `backend` folder and run `npm run dev`.
3. **Frontend**: Open `frontend` folder and run `npm run dev`.
4. **Mobile**: Open `flutter_app` folder and run `flutter run`.

You can also use the **Run and Debug** (Ctrl+Shift+D) tab in VS Code and select **Launch Lumbarong** to start the web app with both backend and frontend tasks.

## 5. Manual Database Import (Optional)
If you prefer not to use the seeding script, you can import the provided SQL file manually:
1. Open **phpMyAdmin**.
2. Create a new database named `lumbarong`.
3. Select the database and click the **Import** tab.
4. Choose the `database.sql` file from the project root.
5. Click **Go** / **Import**.
