import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/api_client.dart';
import '../widgets/app_navbar.dart';

class AddEditAddressScreen extends StatefulWidget {
  final Map<String, dynamic>? initialAddress;

  const AddEditAddressScreen({super.key, this.initialAddress});

  @override
  State<AddEditAddressScreen> createState() => _AddEditAddressScreenState();
}

class _AddEditAddressScreenState extends State<AddEditAddressScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;

  late final TextEditingController _nameController;
  late final TextEditingController _phoneController;
  late final TextEditingController _streetController;
  late final TextEditingController _barangayController;
  late final TextEditingController _cityController;
  late final TextEditingController _provinceController;
  late final TextEditingController _postalController;
  String _label = 'Home';
  bool _isDefault = false;

  @override
  void initState() {
    super.initState();
    final addr = widget.initialAddress;
    _nameController = TextEditingController(text: addr?['fullName'] ?? '');
    _phoneController = TextEditingController(text: addr?['phoneNumber'] ?? '');
    _streetController = TextEditingController(text: addr?['street'] ?? '');
    _barangayController = TextEditingController(text: addr?['barangay'] ?? '');
    _cityController = TextEditingController(text: addr?['city'] ?? '');
    _provinceController = TextEditingController(text: addr?['province'] ?? '');
    _postalController = TextEditingController(text: addr?['postalCode'] ?? '');
    _label = addr?['label'] ?? 'Home';
    _isDefault = addr?['isDefault'] == true;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _streetController.dispose();
    _barangayController.dispose();
    _cityController.dispose();
    _provinceController.dispose();
    _postalController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);
    final data = {
      'fullName': _nameController.text.trim(),
      'phoneNumber': _phoneController.text.trim(),
      'street': _streetController.text.trim(),
      'barangay': _barangayController.text.trim(),
      'city': _cityController.text.trim(),
      'province': _provinceController.text.trim(),
      'postalCode': _postalController.text.trim(),
      'label': _label,
      'isDefault': _isDefault,
    };

    try {
      if (widget.initialAddress != null) {
        await ApiClient().put(
          '/users/addresses/${widget.initialAddress!['id']}',
          data: data,
        );
      } else {
        await ApiClient().post('/users/addresses', data: data);
      }
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Failed to save address')));
      }
    }
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: LumBarongAppBar(
        title: widget.initialAddress != null ? 'Edit Address' : 'New Address',
        showBack: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildSectionLabel('CONTACT INFORMATION'),
              const SizedBox(height: 16),
              _buildTextField(
                _nameController,
                'Full Name',
                Icons.person_outline,
                'Recipient name',
              ),
              const SizedBox(height: 16),
              _buildTextField(
                _phoneController,
                'Phone Number',
                Icons.phone_android_outlined,
                '+63 9XX XXX XXXX',
              ),
              const SizedBox(height: 32),
              _buildSectionLabel('DELIVERY ADDRESS'),
              const SizedBox(height: 16),
              _buildTextField(
                _streetController,
                'Street Name, House No.',
                Icons.map_outlined,
                'e.g. 123 Heritage St.',
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _buildTextField(
                      _barangayController,
                      'Barangay',
                      null,
                      'e.g. Lumban',
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildTextField(
                      _cityController,
                      'City',
                      null,
                      'e.g. Manila',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _buildTextField(
                      _provinceController,
                      'Province',
                      null,
                      'e.g. Laguna',
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildTextField(
                      _postalController,
                      'Postal Code',
                      null,
                      '4016',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),
              _buildSectionLabel('PREFERENCES'),
              const SizedBox(height: 16),
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppTheme.borderLight),
                ),
                child: Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      child: Row(
                        children: [
                          _buildLabelChip('Home'),
                          const SizedBox(width: 12),
                          _buildLabelChip('Office'),
                        ],
                      ),
                    ),
                    const Divider(height: 1, color: AppTheme.borderLight),
                    SwitchListTile(
                      value: _isDefault,
                      onChanged: (v) => setState(() => _isDefault = v),
                      title: const Text(
                        'Set as default address',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      activeThumbColor: AppTheme.primary,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 24,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 48),
              SizedBox(
                width: double.infinity,
                height: 64,
                child: ElevatedButton(
                  onPressed: _loading ? null : _save,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                    elevation: 0,
                  ),
                  child: _loading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text(
                          'SAVE ADDRESS',
                          style: TextStyle(
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.5,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionLabel(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 10,
        fontWeight: FontWeight.w800,
        letterSpacing: 1.5,
        color: AppTheme.textMuted,
      ),
    );
  }

  Widget _buildTextField(
    TextEditingController controller,
    String label,
    IconData? icon,
    String hint,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            color: AppTheme.textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          validator: (v) => v == null || v.isEmpty ? 'Required' : null,
          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(
              color: AppTheme.textMuted,
              fontWeight: FontWeight.w500,
            ),
            prefixIcon: icon != null
                ? Icon(icon, size: 20, color: AppTheme.textMuted)
                : null,
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 20,
              vertical: 16,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: AppTheme.borderLight),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: AppTheme.borderLight),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: AppTheme.primary),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: Colors.redAccent),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLabelChip(String text) {
    final bool isSelected = _label == text;
    return ChoiceChip(
      label: Text(text.toUpperCase()),
      selected: isSelected,
      onSelected: (selected) {
        if (selected) setState(() => _label = text);
      },
      labelStyle: TextStyle(
        fontSize: 10,
        fontWeight: FontWeight.w900,
        letterSpacing: 1,
        color: isSelected ? Colors.white : AppTheme.textMuted,
      ),
      selectedColor: AppTheme.primary,
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isSelected ? AppTheme.primary : AppTheme.borderLight,
        ),
      ),
      showCheckmark: false,
    );
  }
}
