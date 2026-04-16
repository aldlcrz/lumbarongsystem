import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

import 'config/app_theme.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'providers/message_badge_provider.dart';
import 'providers/notification_provider.dart';

// Auth
import 'screens/auth/landing_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';

// Customer
import 'screens/customer/home_screen.dart';
import 'screens/customer/cart_screen.dart';
import 'screens/customer/checkout_screen.dart';
import 'screens/customer/orders_screen.dart';
import 'screens/customer/product_detail_screen.dart';
import 'screens/customer/messages_screen.dart';
import 'screens/customer/chat_detail_screen.dart';
import 'screens/customer/shop_screen.dart';
import 'screens/customer/heritage_guide_screen.dart';
import 'screens/customer/about_screen.dart';
import 'screens/customer/notifications_screen.dart';

// Profile
import 'screens/profile/profile_screen.dart';
import 'screens/profile/address_list_screen.dart';
import 'screens/profile/add_edit_address_screen.dart';
import 'screens/profile/edit_identity_screen.dart';

// Seller
import 'screens/seller/seller_dashboard_screen.dart';
import 'screens/seller/seller_orders_screen.dart';
import 'screens/seller/seller_inventory_screen.dart';
import 'screens/seller/seller_products_screen.dart';
import 'screens/seller/add_product_screen.dart';
import 'screens/seller/edit_product_screen.dart';

// Admin
import 'screens/admin/admin_dashboard_screen.dart';
import 'screens/admin/admin_sellers_screen.dart';
import 'screens/admin/admin_products_screen.dart';
import 'screens/admin/admin_users_screen.dart';
import 'screens/admin/admin_activity_screen.dart';
import 'screens/admin/admin_settings_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final authProvider = AuthProvider();
  final cartProvider = CartProvider();

  final router = GoRouter(
    initialLocation: '/',
    refreshListenable: authProvider,
    redirect: (context, state) {
      final auth = context.read<AuthProvider>();
      if (auth.loading) return null;

      final loc = state.uri.path;
      final isAuthRoute = loc == '/login' || loc == '/register';
      final isLanding = loc == '/';

      if (!auth.isLoggedIn) {
        if (isLanding || isAuthRoute) return null;
        return '/';
      }

      final user = auth.user!;
      if (isAuthRoute || isLanding) {
        if (user.role == 'admin') return '/admin/dashboard';
        if (user.role == 'seller') return '/seller/dashboard';
        return '/home';
      }

      if (user.role == 'admin' && loc.startsWith('/profile')) {
        return '/admin/dashboard';
      }

      return null;
    },
    routes: [
      // Auth
      GoRoute(path: '/', builder: (c, s) => const LandingScreen()),
      GoRoute(path: '/login', builder: (c, s) => const LoginScreen()),
      GoRoute(path: '/register', builder: (c, s) => const RegisterScreen()),

      // Customer
      GoRoute(path: '/home', builder: (c, s) => const HomeScreen()),
      GoRoute(
        path: '/products/:id',
        builder: (c, s) =>
            ProductDetailScreen(productId: s.pathParameters['id']!),
      ),
      GoRoute(path: '/cart', builder: (c, s) => const CartScreen()),
      GoRoute(path: '/checkout', builder: (c, s) => const CheckoutScreen()),
      GoRoute(path: '/orders', builder: (c, s) => const OrdersScreen()),
      GoRoute(path: '/messages', builder: (c, s) => const MessagesScreen()),
      GoRoute(
        path: '/notifications',
        builder: (c, s) => const NotificationsScreen(),
      ),
      GoRoute(
        path: '/shop',
        builder: (c, s) => ShopScreen(sellerId: s.uri.queryParameters['id']),
      ),
      GoRoute(
        path: '/shop/:id',
        builder: (c, s) => ShopScreen(sellerId: s.pathParameters['id']),
      ),
      GoRoute(
        path: '/heritage-guide',
        builder: (c, s) => const HeritageGuideScreen(),
      ),
      GoRoute(path: '/about', builder: (c, s) => const AboutScreen()),
      GoRoute(
        path: '/chat/:userId/:userName',
        builder: (c, s) => ChatDetailScreen(
          otherUserId: s.pathParameters['userId']!,
          otherUserName: s.pathParameters['userName']!,
        ),
      ),

      // Profile
      GoRoute(path: '/profile', builder: (c, s) => const ProfileScreen()),
      GoRoute(
        path: '/profile/addresses',
        builder: (c, s) => const AddressListScreen(),
      ),
      GoRoute(
        path: '/profile/addresses/add',
        builder: (c, s) => const AddEditAddressScreen(),
      ),
      GoRoute(
        path: '/profile/addresses/edit',
        builder: (c, s) => AddEditAddressScreen(
          initialAddress: s.extra as Map<String, dynamic>?,
        ),
      ),
      GoRoute(
        path: '/profile/edit-identity',
        builder: (c, s) => const EditIdentityScreen(),
      ),

      // Seller
      GoRoute(
        path: '/seller/dashboard',
        builder: (c, s) => const SellerDashboardScreen(),
      ),
      GoRoute(
        path: '/seller/orders',
        builder: (c, s) => const SellerOrdersScreen(),
      ),
      GoRoute(
        path: '/seller/inventory',
        builder: (c, s) => const SellerInventoryScreen(),
      ),
      GoRoute(
        path: '/seller/products',
        builder: (c, s) => const SellerProductsScreen(),
      ),
      GoRoute(
        path: '/seller/add-product',
        builder: (c, s) => const AddProductScreen(),
      ),
      GoRoute(
        path: '/seller/edit-product',
        builder: (c, s) =>
            EditProductScreen(productId: s.uri.queryParameters['id']!),
      ),

      // Admin
      GoRoute(
        path: '/admin/dashboard',
        builder: (c, s) => const AdminDashboardScreen(),
      ),
      GoRoute(
        path: '/admin/activity',
        builder: (c, s) => const AdminActivityScreen(),
      ),
      GoRoute(
        path: '/admin/users',
        builder: (c, s) => const AdminUsersScreen(),
      ),
      GoRoute(
        path: '/admin/sellers',
        builder: (c, s) => const AdminSellersScreen(),
      ),
      GoRoute(
        path: '/admin/products',
        builder: (c, s) => const AdminProductsScreen(),
      ),
      GoRoute(
        path: '/admin/settings',
        builder: (c, s) => const AdminSettingsScreen(),
      ),
    ],
  );

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: authProvider),
        ChangeNotifierProvider.value(value: cartProvider),
        ChangeNotifierProvider(create: (_) => MessageBadgeProvider()),
        ChangeNotifierProvider(create: (_) => NotificationProvider()),
      ],
      child: MaterialApp.router(
        title: 'LumBarong',
        theme: AppTheme.theme,
        routerConfig: router,
        debugShowCheckedModeBanner: false,
      ),
    ),
  );
}
