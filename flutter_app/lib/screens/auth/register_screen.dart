import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../widgets/app_navbar.dart';
import 'package:google_fonts/google_fonts.dart';

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
      child: Stack(
        children: [

          
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                child: Container(
                  constraints: const BoxConstraints(maxWidth: 576), // max-w-xl
                  padding: const EdgeInsets.all(40),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(40),
                    border: Border.all(color: AppTheme.borderLight),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF3C2814).withValues(alpha: 0.08),
                        blurRadius: 60,
                        offset: const Offset(0, 20),
                      ),
                    ],
                  ),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Logo
                        GestureDetector(
                          onTap: () => context.go('/'),
                          child: Text(
                            'LumbaRong',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.playfairDisplay(
                              fontSize: 32,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.primary,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'LUMBARONG REGISTRATION',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 3.0,
                            color: AppTheme.textMuted,
                          ),
                        ),
                        const SizedBox(height: 32),

                        if (_statusMessage != null) ...[
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: _isSuccess
                                  ? Colors.green.shade50
                                  : const Color(0xFFFEF0EE),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: _isSuccess
                                    ? Colors.green.shade200
                                    : const Color(0xFFF9D0C8),
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  _isSuccess ? Icons.check_circle : Icons.shield_outlined,
                                  color: _isSuccess ? Colors.green : AppTheme.primary,
                                  size: 18,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    _statusMessage!.toUpperCase(),
                                    style: TextStyle(
                                      color: _isSuccess ? Colors.green.shade800 : AppTheme.primary,
                                      fontWeight: FontWeight.w800,
                                      fontSize: 10,
                                      letterSpacing: 1.0,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 24),
                        ],

                        // Full Name
                        _buildLabel('Registry Name'),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _name,
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppTheme.textPrimary),
                          decoration: _inputDecoration(
                            icon: Icons.person_outline,
                            hint: 'Full Name',
                          ),
                          validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                        ),
                        const SizedBox(height: 20),

                        // Email
                        _buildLabel('Secure Email'),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _email,
                          keyboardType: TextInputType.emailAddress,
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppTheme.textPrimary),
                          decoration: _inputDecoration(
                            icon: Icons.email_outlined,
                            hint: 'name@example.ph',
                          ),
                          validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                        ),
                        const SizedBox(height: 20),
                        
                        // Role Selection Label
                        _buildLabel('Platform Intent (Role Selection)'),
                        const SizedBox(height: 12),
                        // Role Switcher Cards
                        Row(
                          children: [
                            Expanded(
                              child: GestureDetector(
                                onTap: () => setState(() => _role = 'customer'),
                                child: _buildRoleCard(
                                  role: 'customer',
                                  title: 'MEMBER',
                                  icon: Icons.person_outline,
                                  isSelected: _role == 'customer',
                                ),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: GestureDetector(
                                onTap: () => setState(() => _role = 'seller'),
                                child: _buildRoleCard(
                                  role: 'seller',
                                  title: 'ARTISAN',
                                  icon: Icons.shopping_bag_outlined,
                                  isSelected: _role == 'seller',
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 32),

                        if (_role == 'seller') ...[
                          _buildLabel('Shop Name'),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _shopName,
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppTheme.textPrimary),
                            decoration: _inputDecoration(
                              icon: Icons.store_outlined,
                              hint: 'Heritage Shop',
                            ),
                            validator: _role == 'seller' ? (v) => v == null || v.isEmpty ? 'Required' : null : null,
                          ),
                          const SizedBox(height: 20),
                          _buildLabel('GCash Number'),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _gcashNumber,
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppTheme.textPrimary),
                            decoration: _inputDecoration(
                              icon: Icons.phone_android_outlined,
                              hint: '09xx-xxx-xxxx',
                            ),
                            validator: _role == 'seller' ? (v) => v == null || v.isEmpty ? 'Required' : null : null,
                          ),
                          const SizedBox(height: 20),
                          _buildLabel('Artisan Story'),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _shopDescription,
                            maxLines: 3,
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppTheme.textPrimary),
                            decoration: InputDecoration(
                              hintText: 'Tell us about your heritage craft...',
                              hintStyle: const TextStyle(color: Color(0xFFD1D5DB)),
                              filled: true,
                              fillColor: const Color(0xFFF9F6F2),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(30),
                                borderSide: const BorderSide(color: Colors.transparent, width: 1.5),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(30),
                                borderSide: const BorderSide(color: Colors.transparent, width: 1.5),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(30),
                                borderSide: const BorderSide(color: AppTheme.primary, width: 1.5),
                              ),
                            ),
                            validator: _role == 'seller' ? (v) => v == null || v.isEmpty ? 'Required' : null : null,
                          ),
                          const SizedBox(height: 32),
                        ],

                        _buildLabel('Platform Password'),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _password,
                          obscureText: _obscurePassword,
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppTheme.textPrimary),
                          decoration: _inputDecoration(
                            icon: Icons.lock_outline,
                            hint: '••••••••••••',
                            suffix: IconButton(
                              icon: Icon(
                                _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                color: AppTheme.textMuted,
                                size: 16,
                              ),
                              onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                            ),
                          ),
                          validator: (v) => v == null || v.isEmpty ? 'Required' : (v.length < 6 ? 'Min 6 chars' : null),
                        ),
                        const SizedBox(height: 40),

                        // Form submit
                        SizedBox(
                          height: 56,
                          child: ElevatedButton(
                            onPressed: _isLoading ? null : _submit,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.darkSection,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(30),
                              ),
                              elevation: 8,
                              shadowColor: AppTheme.darkSection.withValues(alpha: 0.2),
                            ),
                            child: _isLoading
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                  )
                                : Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Text(
                                        _role == 'seller' ? 'FINALIZE REGISTRY ACCESS' : 'CONTINUE',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w800,
                                          fontSize: 10,
                                          letterSpacing: 2.0,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      const Icon(Icons.arrow_forward, size: 16),
                                    ],
                                  ),
                          ),
                        ),
                        const SizedBox(height: 40),

                        // Footer
                        Wrap(
                          alignment: WrapAlignment.center,
                          crossAxisAlignment: WrapCrossAlignment.center,
                          spacing: 8,
                          runSpacing: 4,
                          children: [
                            const Text(
                              'ALREADY REGISTERED?',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 1.5,
                                color: AppTheme.textMuted,
                              ),
                            ),
                            GestureDetector(
                              onTap: () => context.push('/login'),
                              child: const Text(
                                'SIGN-IN',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 1.5,
                                  color: AppTheme.primary,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRoleCard({required String role, required String title, required IconData icon, required bool isSelected}) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isSelected ? Colors.white : const Color(0xFFF9F6F2),
        border: Border.all(
          color: isSelected ? AppTheme.primary : AppTheme.borderLight,
          width: 1.5,
        ),
        borderRadius: BorderRadius.circular(32),
        boxShadow: isSelected
            ? [BoxShadow(color: AppTheme.primary.withValues(alpha: 0.12), blurRadius: 30, offset: const Offset(0, 12))]
            : [],
      ),
      child: Column(
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 500),
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: isSelected ? AppTheme.primary : Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: isSelected ? [] : [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4)],
            ),
            child: Icon(
              icon,
              color: isSelected ? Colors.white : AppTheme.textMuted,
              size: 20,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w800,
              letterSpacing: 2.0,
              color: AppTheme.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(left: 20),
      child: Text(
        text.toUpperCase(),
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w800,
          letterSpacing: 2.0,
          color: AppTheme.textMuted,
        ),
      ),
    );
  }

  InputDecoration _inputDecoration({required IconData icon, required String hint, Widget? suffix}) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: Color(0xFFD1D5DB)),
      prefixIcon: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Icon(icon, size: 16, color: AppTheme.borderLight),
      ),
      prefixIconConstraints: const BoxConstraints(minWidth: 56),
      suffixIcon: suffix,
      filled: true,
      fillColor: const Color(0xFFF9F6F2),
      contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(30),
        borderSide: const BorderSide(color: Colors.transparent, width: 1.5),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(30),
        borderSide: const BorderSide(color: Colors.transparent, width: 1.5),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(30),
        borderSide: const BorderSide(color: AppTheme.primary, width: 1.5),
      ),
    );
  }
}
