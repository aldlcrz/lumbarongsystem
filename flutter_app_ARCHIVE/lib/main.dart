import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

import 'config/app_theme.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'screens/landing_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/home_screen.dart';
import 'screens/product_detail_screen.dart';
import 'screens/cart_screen.dart';
import 'screens/checkout_screen.dart';
import 'screens/orders_screen.dart';
import 'screens/messages_screen.dart';
import 'screens/heritage_guide_screen.dart';
import 'screens/about_screen.dart';
import 'screens/seller/seller_dashboard_screen.dart';
import 'screens/seller/seller_orders_screen.dart';
import 'screens/seller/seller_inventory_screen.dart';
import 'screens/seller/add_product_screen.dart';
import 'screens/seller/seller_products_screen.dart';
import 'screens/admin/admin_dashboard_screen.dart';
import 'screens/admin/admin_sellers_screen.dart';
import 'screens/admin/admin_products_screen.dart';
import 'screens/admin/admin_settings_screen.dart';
import 'screens/profile/address_list_screen.dart';
import 'screens/profile/add_edit_address_screen.dart';
import 'screens/profile/profile_screen.dart';
import 'screens/chat_detail_screen.dart';

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
        if (isLanding) return null;
        if (isAuthRoute) return null;
        return '/';
      }
      final user = auth.user!;
      if (isAuthRoute) {
        if (user.role == 'admin') return '/admin/dashboard';
        if (user.role == 'seller') return '/seller/dashboard';
        return '/home';
      }
      if (loc == '/') return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/', builder: (context, state) => const LandingScreen()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(path: '/home', builder: (context, state) => const HomeScreen()),
      GoRoute(
        path: '/products/:id',
        builder: (c, s) =>
            ProductDetailScreen(productId: s.pathParameters['id']!),
      ),
      GoRoute(path: '/cart', builder: (context, state) => const CartScreen()),
      GoRoute(
        path: '/checkout',
        builder: (context, state) => const CheckoutScreen(),
      ),
      GoRoute(
        path: '/orders',
        builder: (context, state) => const OrdersScreen(),
      ),
      GoRoute(
        path: '/messages',
        builder: (context, state) => const MessagesScreen(),
      ),
      GoRoute(
        path: '/heritage-guide',
        builder: (context, state) => const HeritageGuideScreen(),
      ),
      GoRoute(path: '/about', builder: (context, state) => const AboutScreen()),
      GoRoute(
        path: '/seller/dashboard',
        builder: (context, state) => const SellerDashboardScreen(),
      ),
      GoRoute(
        path: '/seller/orders',
        builder: (context, state) => const SellerOrdersScreen(),
      ),
      GoRoute(
        path: '/seller/inventory',
        builder: (context, state) => const SellerInventoryScreen(),
      ),
      GoRoute(
        path: '/seller/add-product',
        builder: (context, state) => const AddProductScreen(),
      ),
      GoRoute(
        path: '/seller/products',
        builder: (context, state) => const SellerProductsScreen(),
      ),
      GoRoute(
        path: '/admin/dashboard',
        builder: (context, state) => const AdminDashboardScreen(),
      ),
      GoRoute(
        path: '/admin/sellers',
        builder: (context, state) => const AdminSellersScreen(),
      ),
      GoRoute(
        path: '/admin/products',
        builder: (context, state) => const AdminProductsScreen(),
      ),
      GoRoute(
        path: '/admin/settings',
        builder: (context, state) => const AdminSettingsScreen(),
      ),
      GoRoute(
        path: '/profile/addresses',
        builder: (context, state) => const AddressListScreen(),
      ),
      GoRoute(
        path: '/profile/addresses/add',
        builder: (context, state) => const AddEditAddressScreen(),
      ),
      GoRoute(
        path: '/profile/addresses/edit',
        builder: (context, state) => AddEditAddressScreen(
          initialAddress: state.extra as Map<String, dynamic>?,
        ),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
      GoRoute(
        path: '/chat/:userId/:userName',
        builder: (context, state) => ChatDetailScreen(
          otherUserId: state.pathParameters['userId']!,
          otherUserName: state.pathParameters['userName']!,
        ),
      ),
    ],
  );
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: authProvider),
        ChangeNotifierProvider.value(value: cartProvider),
      ],
      child: MaterialApp.router(
        title: 'LumBarong',
        theme: AppTheme.theme,
        routerConfig: router,
      ),
    ),
  );
}
