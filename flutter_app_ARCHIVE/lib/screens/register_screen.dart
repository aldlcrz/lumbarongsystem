import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../config/app_theme.dart';
import '../providers/auth_provider.dart';
import 'widgets/app_navbar.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  String _role = 'customer';
  String? _statusMessage;
  bool _isSuccess = false;
  bool _isLoading = false;
  bool _obscurePassword = true;

  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _shopName = TextEditingController();
  final _shopDescription = TextEditingController();
  final _gcashNumber = TextEditingController();

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    _shopName.dispose();
    _shopDescription.dispose();
    _gcashNumber.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_role == 'seller') {
      if (_shopName.text.trim().isEmpty) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Shop name required')));
        return;
      }
      if (_gcashNumber.text.trim().isEmpty) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('GCash number required')));
        return;
      }
      if (_shopDescription.text.trim().isEmpty) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Artisan story required')));
        return;
      }
    }
    setState(() {
      _statusMessage = null;
      _isLoading = true;
    });
    final data = {
      'name': _name.text.trim(),
      'email': _email.text.trim(),
      'password': _password.text,
      'role': _role,
      if (_role == 'seller') 'shopName': _shopName.text.trim(),
      if (_role == 'seller') 'shopDescription': _shopDescription.text.trim(),
      if (_role == 'seller') 'gcashNumber': _gcashNumber.text.trim(),
    };
    final result = await context.read<AuthProvider>().register(data);
    if (!mounted) return;
    setState(() {
      _isLoading = false;
      _statusMessage = result['message'] as String?;
      _isSuccess = result['success'] == true;
    });
    if (_isSuccess) {
      Future.delayed(const Duration(milliseconds: 1500), () {
        if (!mounted) return;
        final role = context.read<AuthProvider>().user?.role ?? 'customer';
        if (role == 'seller') {
          context.go('/seller/dashboard');
        } else if (role == 'admin') {
          context.go('/admin/dashboard');
        } else {
          context.go('/home');
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return BarongScaffold(
      child: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: Container(
              constraints: const BoxConstraints(maxWidth: 520),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(40),
                border: Border.all(color: AppTheme.borderLight),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 32,
                    offset: const Offset(0, 12),
                  ),
                ],
              ),
              child: Stack(
                children: [
                  Positioned(
                    top: -40,
                    right: -40,
                    child: Container(
                      width: 140,
                      height: 140,
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withValues(alpha: 0.08),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(36),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          GestureDetector(
                            onTap: () => context.go('/'),
                            child: const Text(
                              'LumBarong',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.w900,
                                fontStyle: FontStyle.italic,
                                color: AppTheme.primary,
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),
                          const Text(
                            'Create Your Account',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 26,
                              fontWeight: FontWeight.w900,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Join our community of heritage craft lovers',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: AppTheme.textSecondary),
                          ),
                          if (_statusMessage != null) ...[
                            const SizedBox(height: 20),
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: _isSuccess
                                    ? Colors.green.shade50
                                    : AppTheme.primary.withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: _isSuccess
                                      ? Colors.green.shade200
                                      : AppTheme.primary.withValues(alpha: 0.2),
                                ),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    _isSuccess
                                        ? Icons.check_circle
                                        : Icons.error_outline,
                                    color: _isSuccess
                                        ? Colors.green
                                        : AppTheme.primary,
                                    size: 22,
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      _statusMessage!,
                                      style: TextStyle(
                                        color: _isSuccess
                                            ? Colors.green.shade800
                                            : AppTheme.primary,
                                        fontWeight: FontWeight.w700,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                          const SizedBox(height: 24),
                          // Role Switcher
                          Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF9FAFB),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: AppTheme.borderLight),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: GestureDetector(
                                    onTap: () =>
                                        setState(() => _role = 'customer'),
                                    child: AnimatedContainer(
                                      duration: const Duration(
                                        milliseconds: 200,
                                      ),
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 12,
                                      ),
                                      decoration: BoxDecoration(
                                        color: _role == 'customer'
                                            ? Colors.white
                                            : Colors.transparent,
                                        borderRadius: BorderRadius.circular(16),
                                        boxShadow: _role == 'customer'
                                            ? [
                                                BoxShadow(
                                                  color: Colors.black
                                                      .withValues(alpha: 0.05),
                                                  blurRadius: 8,
                                                ),
                                              ]
                                            : null,
                                      ),
                                      child: Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        children: [
                                          Icon(
                                            Icons.shopping_bag_outlined,
                                            size: 16,
                                            color: _role == 'customer'
                                                ? AppTheme.primary
                                                : AppTheme.textMuted,
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            'BUYER',
                                            style: TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.w800,
                                              color: _role == 'customer'
                                                  ? AppTheme.primary
                                                  : AppTheme.textMuted,
                                              letterSpacing: 1,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                                Expanded(
                                  child: GestureDetector(
                                    onTap: () =>
                                        setState(() => _role = 'seller'),
                                    child: AnimatedContainer(
                                      duration: const Duration(
                                        milliseconds: 200,
                                      ),
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 12,
                                      ),
                                      decoration: BoxDecoration(
                                        color: _role == 'seller'
                                            ? Colors.white
                                            : Colors.transparent,
                                        borderRadius: BorderRadius.circular(16),
                                        boxShadow: _role == 'seller'
                                            ? [
                                                BoxShadow(
                                                  color: Colors.black
                                                      .withValues(alpha: 0.05),
                                                  blurRadius: 8,
                                                ),
                                              ]
                                            : null,
                                      ),
                                      child: Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        children: [
                                          Icon(
                                            Icons.storefront_outlined,
                                            size: 16,
                                            color: _role == 'seller'
                                                ? AppTheme.primary
                                                : AppTheme.textMuted,
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            'ARTISAN',
                                            style: TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.w800,
                                              color: _role == 'seller'
                                                  ? AppTheme.primary
                                                  : AppTheme.textMuted,
                                              letterSpacing: 1,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 28),
                          _buildLabel('Full Name'),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _name,
                            decoration: const InputDecoration(
                              hintText: 'Juan Dela Cruz',
                              prefixIcon: Icon(Icons.person_outline, size: 20),
                            ),
                            validator: (v) =>
                                v == null || v.isEmpty ? 'Required' : null,
                          ),
                          const SizedBox(height: 20),
                          _buildLabel('Email Address'),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _email,
                            keyboardType: TextInputType.emailAddress,
                            decoration: const InputDecoration(
                              hintText: 'juan@example.ph',
                              prefixIcon: Icon(Icons.email_outlined, size: 20),
                            ),
                            validator: (v) =>
                                v == null || v.isEmpty ? 'Required' : null,
                          ),
                          if (_role == 'seller') ...[
                            const SizedBox(height: 20),
                            _buildLabel('Shop Name'),
                            const SizedBox(height: 6),
                            TextFormField(
                              controller: _shopName,
                              decoration: const InputDecoration(
                                hintText: 'Heritage Shop',
                                prefixIcon: Icon(Icons.store, size: 20),
                              ),
                              validator: _role == 'seller'
                                  ? (v) => v == null || v.isEmpty
                                        ? 'Required'
                                        : null
                                  : null,
                            ),
                            const SizedBox(height: 20),
                            _buildLabel('GCash Number'),
                            const SizedBox(height: 6),
                            TextFormField(
                              controller: _gcashNumber,
                              decoration: const InputDecoration(
                                hintText: '09xx-xxx-xxxx',
                                prefixIcon: Icon(Icons.phone_android, size: 20),
                              ),
                              validator: _role == 'seller'
                                  ? (v) => v == null || v.isEmpty
                                        ? 'Required'
                                        : null
                                  : null,
                            ),
                            const SizedBox(height: 20),
                            _buildLabel('Artisan Story'),
                            const SizedBox(height: 6),
                            TextFormField(
                              controller: _shopDescription,
                              maxLines: 3,
                              decoration: const InputDecoration(
                                hintText:
                                    'Tell us about your heritage craft...',
                              ),
                              validator: _role == 'seller'
                                  ? (v) => v == null || v.isEmpty
                                        ? 'Required'
                                        : null
                                  : null,
                            ),
                          ],
                          const SizedBox(height: 20),
                          _buildLabel('Password'),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _password,
                            obscureText: _obscurePassword,
                            decoration: InputDecoration(
                              hintText: '••••••••',
                              prefixIcon: const Icon(
                                Icons.lock_outline,
                                size: 20,
                              ),
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscurePassword
                                      ? Icons.visibility_off_outlined
                                      : Icons.visibility_outlined,
                                  color: AppTheme.textMuted,
                                  size: 20,
                                ),
                                onPressed: () => setState(
                                  () => _obscurePassword = !_obscurePassword,
                                ),
                              ),
                            ),
                            validator: (v) => v == null || v.isEmpty
                                ? 'Required'
                                : (v.length < 6 ? 'Min 6 characters' : null),
                          ),
                          const SizedBox(height: 32),
                          SizedBox(
                            height: 56,
                            child: ElevatedButton(
                              onPressed: _isLoading ? null : _submit,
                              child: _isLoading
                                  ? const SizedBox(
                                      height: 22,
                                      width: 22,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
                                    )
                                  : Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Text(
                                          _role == 'seller'
                                              ? 'Register as Artisan'
                                              : 'Create My Account',
                                        ),
                                        const SizedBox(width: 8),
                                        const Icon(
                                          Icons.arrow_forward,
                                          size: 20,
                                        ),
                                      ],
                                    ),
                            ),
                          ),
                          const SizedBox(height: 24),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Text(
                                'Already part of the heritage? ',
                                style: TextStyle(color: AppTheme.textSecondary),
                              ),
                              GestureDetector(
                                onTap: () => context.push('/login'),
                                child: const Text(
                                  'Sign In Here',
                                  style: TextStyle(
                                    color: AppTheme.primary,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Text(
        text.toUpperCase(),
        style: const TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.w800,
          letterSpacing: 1.5,
          color: AppTheme.textMuted,
        ),
      ),
    );
  }
}
