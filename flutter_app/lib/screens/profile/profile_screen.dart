import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../config/app_theme.dart';
import '../../config/api_config.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_client.dart';
import '../widgets/app_navbar.dart';

enum _ProfileTab { accountInfo, changePassword }

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final ApiClient _api = ApiClient();

  _ProfileTab _activeTab = _ProfileTab.accountInfo;

  bool _loadingProfile = true;
  bool _isEditingProfile = false;
  bool _isSavingProfile = false;
  bool _isSavingPassword = false;

  bool _showCurrentPassword = false;
  bool _showNewPassword = false;
  bool _showConfirmPassword = false;

  Map<String, dynamic>? _profileUser;
  String _defaultLocation = 'Registry not set';

  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _mobileController = TextEditingController();
  final TextEditingController _currentPasswordController =
      TextEditingController();
  final TextEditingController _newPasswordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _mobileController.dispose();
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _loadProfile() async {
    if (mounted) setState(() => _loadingProfile = true);
    try {
      final results = await Future.wait([
        _api.get('/users/profile'),
        _api.get('/users/addresses'),
      ]);

      final data = results[0].data;
      final addressesData = results[1].data;

      Map<String, dynamic>? parsed;
      if (data is Map && data['user'] is Map) {
        parsed = Map<String, dynamic>.from(data['user'] as Map);
      } else if (data is Map) {
        parsed = Map<String, dynamic>.from(data);
      }

      String resolvedLocation = 'Registry not set';
      if (addressesData is List && addressesData.isNotEmpty) {
        final addresses = addressesData
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList();

        Map<String, dynamic>? defaultAddress;
        for (final a in addresses) {
          if (a['isDefault'] == true) {
            defaultAddress = a;
            break;
          }
        }

        defaultAddress ??= addresses.first;
        resolvedLocation = _formatAddressLocation(defaultAddress);
      }

      if (!mounted) return;
      setState(() {
        _profileUser = parsed;
        _nameController.text = _profileUser?['name']?.toString() ?? '';
        _mobileController.text =
            _profileUser?['mobileNumber']?.toString() ??
            _profileUser?['mobile']?.toString() ??
            '';
        _defaultLocation = resolvedLocation;
        _loadingProfile = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loadingProfile = false);
    }
  }

  Future<void> _saveProfile(AuthProvider auth) async {
    final name = _nameController.text.trim();
    final mobile = _mobileController.text.trim();

    if (name.isEmpty) {
      _showSnack('Name is required.');
      return;
    }

    setState(() => _isSavingProfile = true);
    try {
      final res = await _api.put(
        '/users/profile',
        data: {'name': name, 'mobileNumber': mobile},
      );

      Map<String, dynamic>? updated;
      final data = res.data;
      if (data is Map && data['user'] is Map) {
        updated = Map<String, dynamic>.from(data['user'] as Map);
      } else if (data is Map) {
        updated = Map<String, dynamic>.from(data);
      }

      if (!mounted) return;

      if (updated != null) {
        setState(() {
          _profileUser = updated;
          _nameController.text = updated!['name']?.toString() ?? '';
          _mobileController.text =
              updated['mobileNumber']?.toString() ??
              updated['mobile']?.toString() ??
              '';
          _isEditingProfile = false;
        });

        await auth.updateStoredUser(updated);
      }

      _showSnack('Profile updated successfully.');
    } catch (e) {
      _showSnack(_extractError(e, 'Failed to update profile.'));
    } finally {
      if (mounted) setState(() => _isSavingProfile = false);
    }
  }

  Future<void> _changePassword() async {
    final current = _currentPasswordController.text;
    final next = _newPasswordController.text;
    final confirm = _confirmPasswordController.text;

    if (current.isEmpty || next.isEmpty || confirm.isEmpty) {
      _showSnack('Please fill in all password fields.');
      return;
    }
    if (next.length < 6 || next.length > 32) {
      _showSnack('New password must be 6 to 32 characters.');
      return;
    }
    if (next != confirm) {
      _showSnack('New password and confirmation do not match.');
      return;
    }

    setState(() => _isSavingPassword = true);
    try {
      await _api.put(
        '/users/change-password',
        data: {'currentPassword': current, 'newPassword': next},
      );

      if (!mounted) return;

      _currentPasswordController.clear();
      _newPasswordController.clear();
      _confirmPasswordController.clear();
      _showSnack('Password changed successfully.');
    } catch (e) {
      _showSnack(_extractError(e, 'Failed to update password.'));
    } finally {
      if (mounted) setState(() => _isSavingPassword = false);
    }
  }

  String _extractError(Object error, String fallback) {
    try {
      final dynamic e = error;
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        return data['message'].toString();
      }
    } catch (_) {}
    return fallback;
  }

  void _showSnack(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  String _displayName(AuthProvider auth) {
    final profileName = _profileUser?['name']?.toString();
    if (profileName != null && profileName.trim().isNotEmpty)
      return profileName;
    return auth.user?.name ?? 'User';
  }

  String _displayEmail(AuthProvider auth) {
    final profileEmail = _profileUser?['email']?.toString();
    if (profileEmail != null && profileEmail.trim().isNotEmpty) {
      return profileEmail.toLowerCase();
    }
    return (auth.user?.email ?? 'unknown@email.com').toLowerCase();
  }

  String _displayRoleBadge(AuthProvider auth) {
    return auth.user?.role == 'seller' ? 'ARTISAN' : 'COLLECTOR';
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (!auth.isLoggedIn) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (context.mounted) context.go('/');
      });
      return const SizedBox.shrink();
    }

    final user = auth.user!;
    final int navIndex = user.role == 'admin' ? 3 : 4;

    if (user.role == 'customer') {
      return _buildCustomerLegacyScaffold(auth, navIndex);
    }

    if (user.role == 'seller') {
      return _buildSellerProfileScaffold(auth, navIndex);
    }

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: const LumBarongAppBar(title: 'My Profile', showBack: true),
      bottomNavigationBar: AppBottomNav(currentIndex: navIndex),
      body: RefreshIndicator(
        color: AppTheme.primary,
        onRefresh: _loadProfile,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.fromLTRB(22, 14, 22, 14),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: user.role == 'seller'
                        ? const [Color(0xFF2D2A28), Color(0xFF1F1C1A)]
                        : const [Color(0xFFFFFFFF), Color(0xFFF8F5F1)],
                  ),
                  borderRadius: BorderRadius.circular(26),
                  border: Border.all(
                    color: user.role == 'seller'
                        ? Colors.white.withValues(alpha: 0.1)
                        : AppTheme.borderLight.withValues(alpha: 0.5),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.06),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Container(
                      width: 84,
                      height: 84,
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: user.role == 'seller'
                              ? AppTheme.primary.withValues(alpha: 0.3)
                              : AppTheme.borderLight,
                          width: 2,
                        ),
                      ),
                      child: Container(
                        decoration: BoxDecoration(
                          color: user.role == 'seller'
                              ? Colors.white.withValues(alpha: 0.05)
                              : AppTheme.background,
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            _displayName(auth).isNotEmpty
                                ? _displayName(auth)[0].toUpperCase()
                                : '?',
                            style: TextStyle(
                              fontSize: 36,
                              fontWeight: FontWeight.w900,
                              color: user.role == 'seller'
                                  ? Colors.white
                                  : AppTheme.primary,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      user.role == 'seller'
                          ? (_profileUser?['shopName']?.toString() ??
                                _displayName(auth))
                          : _displayName(auth),
                      textAlign: TextAlign.center,
                      style: GoogleFonts.playfairDisplay(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: user.role == 'seller'
                            ? Colors.white
                            : AppTheme.charcoal,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _displayEmail(auth),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: user.role == 'seller'
                            ? Colors.white.withValues(alpha: 0.5)
                            : AppTheme.textMuted,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: user.role == 'seller'
                            ? Colors.white.withValues(alpha: 0.08)
                            : AppTheme.background,
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(
                          color: user.role == 'seller'
                              ? Colors.white.withValues(alpha: 0.15)
                              : AppTheme.borderLight,
                        ),
                      ),
                      child: Text(
                        _displayRoleBadge(auth),
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2,
                          color: user.role == 'seller'
                              ? Colors.white.withValues(alpha: 0.9)
                              : AppTheme.textSecondary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              if (user.role == 'seller') ...[
                _buildSellerWorkshopPanel(auth),
                const SizedBox(height: 24),
              ],

              _buildAccountPanel(auth),

              const SizedBox(height: 32),

              if (user.role == 'admin') ...[
                _buildSectionHeader('PLATFORM COMMAND'),
                const SizedBox(height: 16),
                _buildActionTile(
                  icon: Icons.admin_panel_settings_outlined,
                  title: 'Admin Dashboard',
                  subtitle: 'Overview of system status',
                  onTap: () => context.go('/admin/dashboard'),
                ),
                const SizedBox(height: 12),
                _buildActionTile(
                  icon: Icons.people_outline_rounded,
                  title: 'Seller Approvals',
                  subtitle: 'Verify new artisans',
                  onTap: () => context.push('/admin/sellers'),
                ),
                const SizedBox(height: 12),
                _buildActionTile(
                  icon: Icons.inventory_outlined,
                  title: 'Global Catalog',
                  subtitle: 'Manage all platform products',
                  onTap: () => context.push('/admin/products'),
                ),
              ],

              const SizedBox(height: 12),
              if (user.role != 'admin')
                _buildActionTile(
                  icon: Icons.chat_bubble_outline_rounded,
                  title: 'Message Center',
                  subtitle:
                      'Chat with ${user.role == 'customer' ? 'artisans' : 'customers'}',
                  onTap: () => context.push('/messages'),
                ),

              const SizedBox(height: 32),
              _buildSectionHeader('SYSTEM'),
              const SizedBox(height: 16),
              _buildActionTile(
                icon: Icons.info_outline_rounded,
                title: 'About LumBarong',
                subtitle: 'Learn about our heritage',
                onTap: () => context.push('/about'),
              ),
              const SizedBox(height: 12),
              _buildActionTile(
                icon: Icons.logout_rounded,
                title: 'Sign Out',
                subtitle: 'Safely end your session',
                color: Colors.redAccent,
                onTap: () async {
                  final confirm = await showDialog<bool>(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      title: const Text(
                        'Sign Out',
                        style: TextStyle(fontWeight: FontWeight.w900),
                      ),
                      content: const Text('Are you sure you want to log out?'),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(ctx, false),
                          child: const Text('CANCEL'),
                        ),
                        TextButton(
                          onPressed: () => Navigator.pop(ctx, true),
                          child: const Text(
                            'LOGOUT',
                            style: TextStyle(color: Colors.red),
                          ),
                        ),
                      ],
                    ),
                  );
                  if (confirm == true) {
                    await auth.logout();
                    if (context.mounted) context.go('/');
                  }
                },
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSellerProfileScaffold(AuthProvider auth, int navIndex) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: const LumBarongAppBar(title: 'My Profile', showBack: true),
      bottomNavigationBar: AppBottomNav(currentIndex: navIndex),
      body: RefreshIndicator(
        color: AppTheme.primary,
        onRefresh: _loadProfile,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 4),
              const Text(
                'Profile',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textMuted,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Workshop',
                style: GoogleFonts.playfairDisplay(
                  fontSize: 34,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.charcoal,
                  height: 1.0,
                ),
              ),
              Text(
                'Profile',
                style: GoogleFonts.playfairDisplay(
                  fontSize: 34,
                  fontWeight: FontWeight.w800,
                  fontStyle: FontStyle.italic,
                  color: AppTheme.primary,
                  height: 1.0,
                ),
              ),
              const SizedBox(height: 20),
              LayoutBuilder(
                builder: (context, constraints) {
                  final isWide = constraints.maxWidth >= 760;
                  final leftWidth = isWide
                      ? (constraints.maxWidth - 16) * 0.34
                      : constraints.maxWidth;
                  final rightWidth = isWide
                      ? (constraints.maxWidth - 16) * 0.66
                      : constraints.maxWidth;
                  return isWide
                      ? Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            SizedBox(
                              width: leftWidth,
                              child: _buildSellerIdentityCard(auth),
                            ),
                            const SizedBox(width: 16),
                            SizedBox(
                              width: rightWidth,
                              child: _buildSellerWorkshopPanel(auth),
                            ),
                          ],
                        )
                      : Column(
                          children: [
                            _buildSellerIdentityCard(auth),
                            const SizedBox(height: 16),
                            _buildSellerWorkshopPanel(auth),
                          ],
                        );
                },
              ),
              const SizedBox(height: 24),
              _buildSectionHeader('SYSTEM'),
              const SizedBox(height: 14),
              _buildActionTile(
                icon: Icons.info_outline_rounded,
                title: 'About LumBarong',
                subtitle: 'Learn about our heritage',
                onTap: () => context.push('/about'),
              ),
              const SizedBox(height: 10),
              _buildActionTile(
                icon: Icons.logout_rounded,
                title: 'Sign Out',
                subtitle: 'Safely end your session',
                color: Colors.redAccent,
                onTap: () async {
                  final confirm = await showDialog<bool>(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      title: const Text(
                        'Sign Out',
                        style: TextStyle(fontWeight: FontWeight.w900),
                      ),
                      content: const Text('Are you sure you want to log out?'),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(ctx, false),
                          child: const Text('CANCEL'),
                        ),
                        TextButton(
                          onPressed: () => Navigator.pop(ctx, true),
                          child: const Text(
                            'LOGOUT',
                            style: TextStyle(color: Colors.red),
                          ),
                        ),
                      ],
                    ),
                  );
                  if (confirm == true) {
                    await auth.logout();
                    if (context.mounted) context.go('/');
                  }
                },
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSellerIdentityCard(AuthProvider auth) {
    final user = auth.user!;
    final shopName =
        _profileUser?['shopName']?.toString().trim().isNotEmpty == true
        ? _profileUser!['shopName'].toString().trim()
        : _displayName(auth);
    final profilePhoto =
        _profileUser?['profilePhoto']?.toString().trim().isNotEmpty == true
        ? _profileUser!['profilePhoto'].toString().trim()
        : user.profileImage;
    final photoUrl = _resolveImageUrl(profilePhoto, 'profile_photos');
    final socialLinks = _sellerSocialLinks();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: AppTheme.borderLight.withValues(alpha: 0.55)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            width: 104,
            height: 104,
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: AppTheme.borderLight, width: 2),
            ),
            child: ClipOval(
              child: photoUrl != null
                  ? Image.network(
                      photoUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) =>
                          _sellerAvatarFallback(shopName),
                    )
                  : _sellerAvatarFallback(shopName),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            shopName,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: AppTheme.charcoal,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            _displayEmail(auth),
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppTheme.textMuted,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
            decoration: BoxDecoration(
              color: (_profileUser?['isVerified'] == true)
                  ? const Color(0xFFE8F7EC)
                  : const Color(0xFFFFF3DB),
              borderRadius: BorderRadius.circular(999),
              border: Border.all(
                color: (_profileUser?['isVerified'] == true)
                    ? const Color(0xFFB6E4C1)
                    : const Color(0xFFF3D49A),
              ),
            ),
            child: Text(
              (_profileUser?['isVerified'] == true)
                  ? 'STATUS: VERIFIED'
                  : 'REVIEW IN PROGRESS',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w900,
                letterSpacing: 2,
                color: (_profileUser?['isVerified'] == true)
                    ? const Color(0xFF1F7A3B)
                    : const Color(0xFFA36B00),
              ),
            ),
          ),
          const SizedBox(height: 18),
          if (socialLinks.isNotEmpty)
            Wrap(
              alignment: WrapAlignment.center,
              spacing: 8,
              runSpacing: 8,
              children: socialLinks,
            )
          else
            const Text(
              'No Social Links',
              style: TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.w800,
                color: AppTheme.textMuted,
                letterSpacing: 1.6,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildCustomerLegacyScaffold(AuthProvider auth, int navIndex) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: const LumBarongAppBar(title: 'My Profile', showBack: true),
      bottomNavigationBar: AppBottomNav(currentIndex: navIndex),
      body: RefreshIndicator(
        color: AppTheme.primary,
        onRefresh: _loadProfile,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          child: Column(
            children: [
              _buildCustomerProfileCard(auth),
              const SizedBox(height: 20),
              _buildCustomerAccountPanel(auth),
              const SizedBox(height: 28),
              _buildSectionHeader('ACCOUNT MANAGEMENT'),
              const SizedBox(height: 14),
              _buildActionTile(
                icon: Icons.location_on_outlined,
                title: 'Saved Addresses',
                subtitle: 'Manage delivery locations',
                onTap: () => context.push('/profile/addresses'),
              ),
              const SizedBox(height: 10),
              _buildActionTile(
                icon: Icons.chat_bubble_outline_rounded,
                title: 'Message Center',
                subtitle: 'Chat with artisans',
                onTap: () => context.push('/messages'),
              ),
              const SizedBox(height: 10),
              _buildActionTile(
                icon: Icons.info_outline_rounded,
                title: 'About LumBarong',
                subtitle: 'Learn about our heritage',
                onTap: () => context.push('/about'),
              ),
              const SizedBox(height: 10),
              _buildActionTile(
                icon: Icons.logout_rounded,
                title: 'Sign Out',
                subtitle: 'Safely end your session',
                color: Colors.redAccent,
                onTap: () async {
                  final confirm = await showDialog<bool>(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      title: const Text(
                        'Sign Out',
                        style: TextStyle(fontWeight: FontWeight.w900),
                      ),
                      content: const Text('Are you sure you want to log out?'),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(ctx, false),
                          child: const Text('CANCEL'),
                        ),
                        TextButton(
                          onPressed: () => Navigator.pop(ctx, true),
                          child: const Text(
                            'LOGOUT',
                            style: TextStyle(color: Colors.red),
                          ),
                        ),
                      ],
                    ),
                  );
                  if (confirm == true) {
                    await auth.logout();
                    if (context.mounted) context.go('/');
                  }
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCustomerProfileCard(AuthProvider auth) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: AppTheme.borderLight.withValues(alpha: 0.5)),
      ),
      child: Column(
        children: [
          Container(
            width: 92,
            height: 92,
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: AppTheme.borderLight, width: 2),
            ),
            child: Container(
              decoration: const BoxDecoration(
                color: AppTheme.background,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  _displayName(auth).isNotEmpty
                      ? _displayName(auth)[0].toUpperCase()
                      : '?',
                  style: const TextStyle(
                    fontSize: 42,
                    fontWeight: FontWeight.w900,
                    color: AppTheme.primary,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            _displayName(auth),
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: AppTheme.charcoal,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            _displayEmail(auth),
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppTheme.textMuted,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
            decoration: BoxDecoration(
              color: AppTheme.background,
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: AppTheme.borderLight),
            ),
            child: Text(
              _displayRoleBadge(auth),
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w900,
                letterSpacing: 3,
                color: AppTheme.textSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCustomerAccountPanel(AuthProvider auth) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.borderLight),
      ),
      child: Column(
        children: [
          Row(
            children: [
              _customerTabButton(_ProfileTab.accountInfo, 'Account Info'),
              _customerTabButton(_ProfileTab.changePassword, 'Change Password'),
            ],
          ),
          Container(height: 1, color: AppTheme.borderLight),
          Padding(
            padding: const EdgeInsets.all(14),
            child: _activeTab == _ProfileTab.accountInfo
                ? _buildCustomerAccountInfoContent(auth)
                : _buildChangePasswordContent(),
          ),
        ],
      ),
    );
  }

  Widget _customerTabButton(_ProfileTab tab, String label) {
    final selected = _activeTab == tab;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _activeTab = tab),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  color: selected ? AppTheme.charcoal : AppTheme.textMuted,
                ),
              ),
            ),
            Container(
              height: 3,
              color: selected ? AppTheme.primary : Colors.transparent,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCustomerAccountInfoContent(AuthProvider auth) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Account Information',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                color: AppTheme.charcoal,
              ),
            ),
            TextButton.icon(
              onPressed: _isSavingProfile
                  ? null
                  : () {
                      setState(() {
                        if (_isEditingProfile) {
                          _nameController.text =
                              _profileUser?['name']?.toString() ??
                              _nameController.text;
                          _mobileController.text =
                              _profileUser?['mobileNumber']?.toString() ??
                              _profileUser?['mobile']?.toString() ??
                              '';
                        }
                        _isEditingProfile = !_isEditingProfile;
                      });
                    },
              icon: Icon(
                _isEditingProfile ? Icons.close_rounded : Icons.edit_outlined,
                color: AppTheme.primary,
                size: 16,
              ),
              label: Text(
                _isEditingProfile ? 'Cancel' : 'Edit',
                style: const TextStyle(
                  color: AppTheme.primary,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (_loadingProfile)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 20),
            child: Center(
              child: CircularProgressIndicator(color: AppTheme.primary),
            ),
          )
        else if (_isEditingProfile) ...[
          _profileInputField(
            label: 'Full Name',
            controller: _nameController,
            icon: Icons.person_outline_rounded,
          ),
          const SizedBox(height: 12),
          _profileInputField(
            label: 'Phone Number',
            controller: _mobileController,
            icon: Icons.phone_outlined,
            keyboardType: TextInputType.phone,
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isSavingProfile ? null : () => _saveProfile(auth),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: _isSavingProfile
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text(
                      'Save Changes',
                      style: TextStyle(fontWeight: FontWeight.w800),
                    ),
            ),
          ),
        ] else ...[
          _infoField(
            icon: Icons.person_outline_rounded,
            label: 'Full Name',
            child: _valueText(_displayName(auth)),
          ),
          const SizedBox(height: 10),
          _infoField(
            icon: Icons.email_outlined,
            label: 'Email Address',
            child: _valueText(_displayEmail(auth), muted: true),
          ),
          const SizedBox(height: 10),
          _infoField(
            icon: Icons.phone_outlined,
            label: 'Phone Number',
            child: _valueText(
              _mobileController.text.trim().isEmpty
                  ? 'Not set'
                  : _mobileController.text.trim(),
            ),
          ),
          const SizedBox(height: 10),
          _infoField(
            icon: Icons.location_on_outlined,
            label: 'Default Location',
            child: _valueText(_defaultLocation, muted: true),
          ),
        ],
      ],
    );
  }

  Widget _buildAccountPanel(AuthProvider auth) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Colors.white, Color(0xFFFCF8F3)],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Column(
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFFF2E7DE), Color(0xFFF8F3EE)],
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.badge_outlined,
                      color: AppTheme.primary,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Account Information',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.charcoal,
                          ),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Your profile details and contact info',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: AppTheme.textMuted,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: TextButton.icon(
                            onPressed: _isSavingProfile
                                ? null
                                : () {
                                    setState(() {
                                      if (_isEditingProfile) {
                                        _nameController.text =
                                            _profileUser?['name']?.toString() ??
                                            _nameController.text;
                                        _mobileController.text =
                                            _profileUser?['mobileNumber']
                                                ?.toString() ??
                                            _profileUser?['mobile']
                                                ?.toString() ??
                                            '';
                                      }
                                      _isEditingProfile = !_isEditingProfile;
                                    });
                                  },
                            style: TextButton.styleFrom(
                              foregroundColor: AppTheme.primary,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 0,
                                vertical: 0,
                              ),
                              visualDensity: VisualDensity.compact,
                            ),
                            icon: Icon(
                              _isEditingProfile
                                  ? Icons.close_rounded
                                  : Icons.edit_rounded,
                              size: 16,
                            ),
                            label: Text(
                              _isEditingProfile
                                  ? 'Cancel Edit'
                                  : 'Edit Information',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 16),
              child: _loadingProfile
                  ? const Padding(
                      padding: EdgeInsets.symmetric(vertical: 20),
                      child: Center(
                        child: CircularProgressIndicator(
                          color: AppTheme.primary,
                        ),
                      ),
                    )
                  : _isEditingProfile
                  ? Column(
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: _profileInputField(
                                label: 'Full Name',
                                controller: _nameController,
                                icon: Icons.person_outline_rounded,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: _profileInputField(
                                label: 'Mobile Number',
                                controller: _mobileController,
                                icon: Icons.phone_iphone_outlined,
                                keyboardType: TextInputType.phone,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: _profileInfoTile(
                                icon: Icons.email_outlined,
                                label: 'Email Address',
                                value: _displayEmail(auth),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: _profileInfoTile(
                                icon: Icons.location_on_outlined,
                                label: 'Default Address',
                                value: _defaultLocation,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: _isSavingProfile
                                ? null
                                : () => _saveProfile(auth),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.primary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 14,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                              elevation: 0,
                            ),
                            icon: _isSavingProfile
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  )
                                : const Icon(Icons.save_rounded, size: 18),
                            label: Text(
                              _isSavingProfile
                                  ? 'Saving...'
                                  : 'Save Information',
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ),
                      ],
                    )
                  : Column(
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: _profileInfoTile(
                                icon: Icons.person_outline_rounded,
                                label: 'Full Name',
                                value: _displayName(auth),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: _profileInfoTile(
                                icon: Icons.email_outlined,
                                label: 'Email Address',
                                value: _displayEmail(auth),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Expanded(
                              child: _profileInfoTile(
                                icon: Icons.phone_iphone_outlined,
                                label: 'Mobile Number',
                                value: _mobileController.text.trim().isEmpty
                                    ? 'Not set'
                                    : _mobileController.text.trim(),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: _profileInfoTile(
                                icon: Icons.location_on_outlined,
                                label: 'Default Address',
                                value: _defaultLocation,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 18),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Keep these details current so checkout, delivery, and support stay accurate.',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppTheme.textMuted.withValues(alpha: 0.9),
                    height: 1.45,
                  ),
                ),
              ),
            ),
            Container(
              width: double.infinity,
              height: 1,
              color: AppTheme.borderLight.withValues(alpha: 0.4),
            ),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFFC74520), Color(0xFFA83D1A)],
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.security_outlined,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'Account Security',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: _loadingProfile
                  ? const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: Center(
                        child: CircularProgressIndicator(
                          color: AppTheme.primary,
                        ),
                      ),
                    )
                  : _buildChangePasswordContent(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _profileInfoTile({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFAF9F7),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderLight.withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Icon(icon, size: 12, color: AppTheme.primary),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  label.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textMuted,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppTheme.charcoal,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSellerWorkshopPanel(AuthProvider auth) {
    final createdAtRaw = _profileUser?['createdAt']?.toString();
    final createdAt = createdAtRaw != null
        ? DateTime.tryParse(createdAtRaw)
        : null;
    final establishedOn = createdAt != null
        ? DateFormat('MMMM yyyy').format(createdAt)
        : 'Unknown';
    final shopName =
        _profileUser?['shopName']?.toString().trim().isNotEmpty == true
        ? _profileUser!['shopName'].toString().trim()
        : _displayName(auth);
    final facebook = _profileUser?['facebookLink']?.toString().trim() ?? '';
    final instagram = _profileUser?['instagramLink']?.toString().trim() ?? '';
    final gcash = _profileUser?['gcashNumber']?.toString().trim() ?? '';
    final maya = _profileUser?['mayaNumber']?.toString().trim() ?? '';
    final hasQr =
        (_profileUser?['gcashQrCode']?.toString().trim().isNotEmpty ?? false);
    final hasMayaQr =
        (_profileUser?['mayaQrCode']?.toString().trim().isNotEmpty ?? false);

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: AppTheme.borderLight.withValues(alpha: 0.55)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(28),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(22, 18, 22, 18),
              decoration: const BoxDecoration(color: Color(0xFFFAF6F1)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Workshop Profile',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: AppTheme.charcoal,
                    ),
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'Your Seller Registry',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: AppTheme.textMuted,
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  LayoutBuilder(
                    builder: (context, constraints) {
                      final isWide = constraints.maxWidth >= 640;
                      final itemWidth = isWide
                          ? (constraints.maxWidth - 12) / 2
                          : constraints.maxWidth;
                      return Wrap(
                        spacing: 12,
                        runSpacing: 12,
                        children: [
                          SizedBox(
                            width: itemWidth,
                            child: _registryTile(
                              icon: Icons.badge_outlined,
                              label: 'Shop Name',
                              value: shopName,
                            ),
                          ),
                          SizedBox(
                            width: itemWidth,
                            child: _registryTile(
                              icon: Icons.email_outlined,
                              label: 'Email Address',
                              value: _displayEmail(auth),
                            ),
                          ),
                          SizedBox(
                            width: itemWidth,
                            child: _registryTile(
                              icon: Icons.phone_iphone_outlined,
                              label: 'Contact Number',
                              value: _mobileController.text.trim().isEmpty
                                  ? '+63 9xx xxx xxxx'
                                  : _mobileController.text.trim(),
                            ),
                          ),
                          SizedBox(
                            width: itemWidth,
                            child: _registryTile(
                              icon: Icons.location_on_outlined,
                              label: 'Location',
                              value: _defaultLocation,
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                  const SizedBox(height: 12),
                  Divider(color: AppTheme.borderLight.withValues(alpha: 0.6)),
                  const SizedBox(height: 12),
                  LayoutBuilder(
                    builder: (context, constraints) {
                      final isWide = constraints.maxWidth >= 640;
                      final itemWidth = isWide
                          ? (constraints.maxWidth - 12) / 2
                          : constraints.maxWidth;
                      return Wrap(
                        spacing: 12,
                        runSpacing: 12,
                        children: [
                          SizedBox(
                            width: itemWidth,
                            child: _registryTile(
                              icon: Icons.calendar_month_outlined,
                              label: 'Established On',
                              value: establishedOn,
                            ),
                          ),
                          SizedBox(
                            width: itemWidth,
                            child: _registryTile(
                              icon: Icons.verified_user_outlined,
                              label: 'Indigency Status',
                              value: (_profileUser?['isVerified'] == true)
                                  ? 'Active Support Level'
                                  : 'Pending Verification',
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                  const SizedBox(height: 12),
                  Divider(color: AppTheme.borderLight.withValues(alpha: 0.6)),
                  const SizedBox(height: 12),
                  LayoutBuilder(
                    builder: (context, constraints) {
                      final isWide = constraints.maxWidth >= 640;
                      final itemWidth = isWide
                          ? (constraints.maxWidth - 12) / 2
                          : constraints.maxWidth;
                      return Wrap(
                        spacing: 12,
                        runSpacing: 12,
                        children: [
                          SizedBox(
                            width: itemWidth,
                            child: _registryTile(
                              icon: Icons.facebook,
                              label: 'Facebook',
                              value: facebook.isEmpty ? 'Unlinked' : 'Linked',
                            ),
                          ),
                          SizedBox(
                            width: itemWidth,
                            child: _registryTile(
                              icon: Icons.camera_alt_outlined,
                              label: 'Instagram',
                              value: instagram.isEmpty ? 'Unlinked' : 'Linked',
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                  const SizedBox(height: 12),
                  Divider(color: AppTheme.borderLight.withValues(alpha: 0.6)),
                  const SizedBox(height: 12),
                  LayoutBuilder(
                    builder: (context, constraints) {
                      final isWide = constraints.maxWidth >= 640;
                      final itemWidth = isWide
                          ? (constraints.maxWidth - 12) / 2
                          : constraints.maxWidth;
                      return Wrap(
                        spacing: 12,
                        runSpacing: 12,
                        children: [
                          SizedBox(
                            width: itemWidth,
                            child: _paymentAccountCard(
                              title: 'GCash Account',
                              number: gcash.isEmpty ? '09XX-XXX-XXXX' : gcash,
                              qrLabel: hasQr ? 'Available' : 'No QR Code',
                              qrUrl: _resolveImageUrl(
                                _profileUser?['gcashQrCode']?.toString(),
                                'seller_documents',
                              ),
                            ),
                          ),
                          SizedBox(
                            width: itemWidth,
                            child: _paymentAccountCard(
                              title: 'Maya Account',
                              number: maya.isEmpty ? '09XX-XXX-XXXX' : maya,
                              qrLabel: hasMayaQr ? 'Available' : 'No QR Code',
                              qrUrl: _resolveImageUrl(
                                _profileUser?['mayaQrCode']?.toString(),
                                'seller_documents',
                              ),
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () =>
                              context.push('/profile/edit-identity'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 14,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                            elevation: 0,
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.edit_rounded, size: 18),
                              SizedBox(width: 8),
                              Text(
                                'Edit Profile',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () async {
                            final confirm = await showDialog<bool>(
                              context: context,
                              builder: (ctx) => AlertDialog(
                                title: const Text(
                                  'Deactivate Workshop',
                                  style: TextStyle(fontWeight: FontWeight.w900),
                                ),
                                content: const Text(
                                  'Are you sure you want to deactivate your workshop? This action can be reversed by contacting support.',
                                ),
                                actions: [
                                  TextButton(
                                    onPressed: () => Navigator.pop(ctx, false),
                                    child: const Text('CANCEL'),
                                  ),
                                  TextButton(
                                    onPressed: () => Navigator.pop(ctx, true),
                                    child: const Text(
                                      'DEACTIVATE',
                                      style: TextStyle(color: AppTheme.primary),
                                    ),
                                  ),
                                ],
                              ),
                            );
                            if (confirm == true) {
                              _showSnack(
                                'Workshop deactivation feature coming soon.',
                              );
                            }
                          },
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppTheme.primary,
                            side: const BorderSide(
                              color: AppTheme.primary,
                              width: 1.5,
                            ),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 14,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.power_settings_new_rounded, size: 18),
                              SizedBox(width: 8),
                              Text(
                                'Deactivate',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _registryTile({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFAF9F7),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderLight.withValues(alpha: 0.45)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Icon(icon, size: 12, color: AppTheme.primary),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  label.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textMuted,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppTheme.charcoal,
            ),
          ),
        ],
      ),
    );
  }

  Widget _paymentAccountCard({
    required String title,
    required String number,
    required String qrLabel,
    String? qrUrl,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.borderLight.withValues(alpha: 0.45)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'PAYMENT ACCOUNT',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.6,
              color: AppTheme.textMuted,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: GoogleFonts.playfairDisplay(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: AppTheme.charcoal,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            number,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: AppTheme.charcoal,
              letterSpacing: 0.2,
            ),
          ),
          const SizedBox(height: 12),
          if (qrUrl != null)
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Container(
                width: 120,
                height: 120,
                color: const Color(0xFFF8F5F1),
                padding: const EdgeInsets.all(8),
                child: Image.network(
                  qrUrl,
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => _qrFallbackBox(qrLabel),
                ),
              ),
            )
          else
            _qrFallbackBox(qrLabel),
        ],
      ),
    );
  }

  Widget _qrFallbackBox(String label) {
    return Container(
      width: 120,
      height: 120,
      decoration: BoxDecoration(
        color: const Color(0xFFF8F5F1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderLight.withValues(alpha: 0.45)),
      ),
      alignment: Alignment.center,
      child: Text(
        label.toUpperCase(),
        textAlign: TextAlign.center,
        style: const TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.w800,
          color: AppTheme.textMuted,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  String _formatAddressLocation(Map<String, dynamic>? address) {
    if (address == null) return 'Registry not set';

    final barangay = address['barangay']?.toString().trim() ?? '';
    final city = address['city']?.toString().trim() ?? '';
    final province = address['province']?.toString().trim() ?? '';

    final parts = <String>[];
    if (barangay.isNotEmpty) parts.add(barangay);
    if (city.isNotEmpty) parts.add(city);
    if (province.isNotEmpty) parts.add(province);

    if (parts.isEmpty) return 'Registry not set';
    return parts.join(', ');
  }

  Widget _buildChangePasswordContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFFC74520), Color(0xFFA83D1A)],
            ),
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFC74520).withValues(alpha: 0.25),
                blurRadius: 16,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.lock_reset_rounded,
                  color: Colors.white,
                  size: 22,
                ),
              ),
              const SizedBox(width: 14),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Change Password',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Update your security settings',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Colors.white70,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 28),
        const Text(
          'Keep your account secure',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: AppTheme.charcoal,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Enter your current password and create a new one.',
          style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
        ),
        const SizedBox(height: 22),
        _buildPasswordFieldNew(
          label: 'Current Password',
          controller: _currentPasswordController,
          obscure: !_showCurrentPassword,
          onToggle: () =>
              setState(() => _showCurrentPassword = !_showCurrentPassword),
          icon: Icons.shield_outlined,
        ),
        const SizedBox(height: 16),
        _buildPasswordFieldNew(
          label: 'New Password',
          controller: _newPasswordController,
          obscure: !_showNewPassword,
          onToggle: () => setState(() => _showNewPassword = !_showNewPassword),
          icon: Icons.lock_outline_rounded,
        ),
        const SizedBox(height: 16),
        _buildPasswordFieldNew(
          label: 'Confirm New Password',
          controller: _confirmPasswordController,
          obscure: !_showConfirmPassword,
          onToggle: () =>
              setState(() => _showConfirmPassword = !_showConfirmPassword),
          icon: Icons.verified_outlined,
        ),
        const SizedBox(height: 26),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _isSavingPassword ? null : _changePassword,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              elevation: 4,
            ),
            child: _isSavingPassword
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      color: Colors.white,
                    ),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Icon(Icons.check_circle_outline_rounded, size: 18),
                      SizedBox(width: 8),
                      Text(
                        'Update Password',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ],
    );
  }

  Widget _profileInputField({
    required String label,
    required TextEditingController controller,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w800,
            color: AppTheme.charcoal,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppTheme.charcoal,
          ),
          decoration: InputDecoration(
            prefixIcon: Icon(icon, size: 18, color: AppTheme.primary),
            filled: true,
            fillColor: const Color(0xFFFAF9F7),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 14,
              vertical: 14,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(
                color: AppTheme.borderLight.withValues(alpha: 0.4),
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(
                color: AppTheme.borderLight.withValues(alpha: 0.4),
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppTheme.primary, width: 1.4),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPasswordFieldNew({
    required String label,
    required TextEditingController controller,
    required bool obscure,
    required VoidCallback onToggle,
    required IconData icon,
  }) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppTheme.charcoal,
              letterSpacing: 0.3,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppTheme.borderLight.withValues(alpha: 0.6),
                width: 1.2,
              ),
            ),
            child: TextField(
              controller: controller,
              obscureText: obscure,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppTheme.charcoal,
              ),
              decoration: InputDecoration(
                border: InputBorder.none,
                prefixIcon: Icon(icon, size: 18, color: AppTheme.primary),
                suffixIcon: Container(
                  margin: const EdgeInsets.only(right: 4),
                  child: IconButton(
                    onPressed: onToggle,
                    icon: Icon(
                      obscure
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                      size: 18,
                      color: AppTheme.textMuted,
                    ),
                    constraints: const BoxConstraints(maxWidth: 48),
                  ),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
                hintStyle: const TextStyle(
                  color: AppTheme.textMuted,
                  fontSize: 14,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoField({
    required IconData icon,
    required String label,
    required Widget child,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 14, color: AppTheme.primary),
              const SizedBox(width: 6),
              Text(
                label.toUpperCase(),
                style: const TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.primary,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          child,
        ],
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) => InputDecoration(
    hintText: hint,
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
    isDense: true,
    contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
  );

  Widget _valueText(String value, {bool muted = false}) {
    return Text(
      value,
      style: TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w700,
        color: muted ? AppTheme.textMuted : AppTheme.charcoal,
      ),
    );
  }

  Widget _sellerAvatarFallback(String name) {
    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'L';
    return Container(
      color: const Color(0xFFF3EEE7),
      alignment: Alignment.center,
      child: Text(
        initial,
        style: const TextStyle(
          fontSize: 42,
          fontWeight: FontWeight.w900,
          color: AppTheme.primary,
        ),
      ),
    );
  }

  String? _resolveImageUrl(String? value, String folder) {
    final path = value?.trim() ?? '';
    if (path.isEmpty) return null;
    if (path.startsWith('http')) return path;
    final fileName = path.split('/').last;
    return '${kApiBaseUrl.replaceFirst('/api/v1', '')}/uploads/$folder/$fileName';
  }

  List<Widget> _sellerSocialLinks() {
    final links = <Map<String, String>>[
      {
        'label': 'Facebook',
        'value': _profileUser?['facebookLink']?.toString().trim() ?? '',
        'icon': 'facebook',
      },
      {
        'label': 'Instagram',
        'value': _profileUser?['instagramLink']?.toString().trim() ?? '',
        'icon': 'camera_alt_outlined',
      },
      {
        'label': 'TikTok',
        'value': _profileUser?['tiktokLink']?.toString().trim() ?? '',
        'icon': 'music_note_rounded',
      },
      {
        'label': 'YouTube',
        'value': _profileUser?['youtubeLink']?.toString().trim() ?? '',
        'icon': 'play_circle_outline_rounded',
      },
    ];

    return links
        .where((link) => link['value'] != null && link['value']!.isNotEmpty)
        .map(
          (link) => _socialLinkChip(
            label: link['label']!,
            url: link['value']!,
            icon: _socialIconFor(link['icon']!),
          ),
        )
        .toList();
  }

  Widget _socialLinkChip({
    required String label,
    required String url,
    required IconData icon,
  }) {
    return InkWell(
      onTap: () => _openExternalLink(url),
      borderRadius: BorderRadius.circular(999),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFFFAF6F1),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: AppTheme.borderLight.withValues(alpha: 0.6),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: AppTheme.primary),
            const SizedBox(width: 6),
            Text(
              label,
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w800,
                color: AppTheme.charcoal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _socialIconFor(String iconName) {
    switch (iconName) {
      case 'facebook':
        return Icons.facebook;
      case 'camera_alt_outlined':
        return Icons.camera_alt_outlined;
      case 'music_note_rounded':
        return Icons.music_note_rounded;
      case 'play_circle_outline_rounded':
        return Icons.play_circle_outline_rounded;
      default:
        return Icons.link_rounded;
    }
  }

  Future<void> _openExternalLink(String rawUrl) async {
    final uri = Uri.tryParse(
      rawUrl.startsWith('http') ? rawUrl : 'https://$rawUrl',
    );
    if (uri == null) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Widget _buildSectionHeader(String title) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Padding(
        padding: const EdgeInsets.only(left: 8),
        child: Text(
          title,
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w900,
            letterSpacing: 2,
            color: AppTheme.textMuted,
          ),
        ),
      ),
    );
  }

  Widget _buildActionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    Color? color,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 12,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: (color ?? AppTheme.primary).withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color ?? AppTheme.primary, size: 20),
        ),
        title: Text(
          title,
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 14,
            color: AppTheme.charcoal,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
        ),
        trailing: const Icon(
          Icons.chevron_right_rounded,
          color: AppTheme.textMuted,
          size: 20,
        ),
      ),
    );
  }
}
