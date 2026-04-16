import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geocoding/geocoding.dart';
import 'package:latlong2/latlong.dart';
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
  final _mapController = MapController();
  bool _loading = false;
  bool _showMapPicker = false;
  bool _reverseGeocoding = false;

  late final TextEditingController _nameController;
  late final TextEditingController _phoneController;
  final TextEditingController _houseNoController = TextEditingController();
  late final TextEditingController _streetController;
  late final TextEditingController _barangayController;
  late final TextEditingController _cityController;
  late final TextEditingController _provinceController;
  late final TextEditingController _postalController;
  String _label = 'Home';
  bool _isDefault = false;
  LatLng? _mapSelection;
  LatLng? _selectedLocation;

  static const LatLng _defaultCenter = LatLng(14.2952, 121.4647);

  @override
  void initState() {
    super.initState();
    final addr = widget.initialAddress;
    _nameController = TextEditingController(
      text:
          addr?['recipientName']?.toString() ??
          addr?['fullName']?.toString() ??
          addr?['name']?.toString() ??
          '',
    );
    _phoneController = TextEditingController(
      text:
          addr?['phone']?.toString() ??
          addr?['phoneNumber']?.toString() ??
          addr?['mobileNumber']?.toString() ??
          '',
    );
    _houseNoController.text = addr?['houseNo']?.toString() ?? '';
    _streetController = TextEditingController(text: addr?['street'] ?? '');
    _barangayController = TextEditingController(text: addr?['barangay'] ?? '');
    _cityController = TextEditingController(text: addr?['city'] ?? '');
    _provinceController = TextEditingController(text: addr?['province'] ?? '');
    _postalController = TextEditingController(text: addr?['postalCode'] ?? '');
    _label = addr?['label']?.toString() ?? 'Home';
    _isDefault = addr?['isDefault'] == true;

    final lat = _toDouble(addr?['latitude']);
    final lng = _toDouble(addr?['longitude']);
    if (lat != null && lng != null) {
      _selectedLocation = LatLng(lat, lng);
      _mapSelection = _selectedLocation;
      _showMapPicker = true;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _houseNoController.dispose();
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
      'recipientName': _nameController.text.trim(),
      'phone': _phoneController.text.trim(),
      'fullName': _nameController.text.trim(),
      'phoneNumber': _phoneController.text.trim(),
      'houseNo': _houseNoController.text.trim(),
      'street': _streetController.text.trim(),
      'barangay': _barangayController.text.trim(),
      'city': _cityController.text.trim(),
      'province': _provinceController.text.trim(),
      'postalCode': _postalController.text.trim(),
      'label': _label,
      'isDefault': _isDefault,
      'latitude': _selectedLocation?.latitude,
      'longitude': _selectedLocation?.longitude,
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
        String message = 'Failed to save address';
        try {
          final dynamic err = e;
          final data = err.response?.data;
          if (data is Map && data['message'] != null) {
            message = data['message'].toString();
          }
        } catch (_) {}
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(message)));
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
              const SizedBox(height: 32),
              _buildTextField(
                _phoneController,
                'Phone Number',
                Icons.phone_android_outlined,
                '+63 9XX XXX XXXX',
              ),
              const SizedBox(height: 32),
              _buildSectionLabel('DELIVERY ADDRESS'),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _buildTextField(
                      _houseNoController,
                      'House No. / Building',
                      null,
                      'e.g. 123',
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildTextField(
                      _streetController,
                      'Street',
                      Icons.map_outlined,
                      'e.g. Heritage St.',
                    ),
                  ),
                ],
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
              const SizedBox(height: 32),
              _buildMapToggle(),
              const SizedBox(height: 16),
              AnimatedCrossFade(
                firstChild: const SizedBox.shrink(),
                secondChild: _buildMapPicker(),
                crossFadeState: _showMapPicker
                    ? CrossFadeState.showSecond
                    : CrossFadeState.showFirst,
                duration: const Duration(milliseconds: 220),
              ),
              const SizedBox(height: 32),
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

  double? _toDouble(dynamic value) {
    if (value == null) return null;
    return double.tryParse(value.toString());
  }

  Future<void> _setPinnedLocation(LatLng location) async {
    setState(() {
      _mapSelection = location;
      _showMapPicker = true;
    });
    _mapController.move(location, 15);
  }

  Future<void> _confirmPinnedLocation() async {
    final location = _mapSelection;
    if (location == null) return;

    setState(() {
      _selectedLocation = location;
      _reverseGeocoding = true;
    });

    try {
      await _fillAddressFromLocation(location);
    } finally {
      if (mounted) {
        setState(() => _reverseGeocoding = false);
      }
    }
  }

  Future<void> _fillAddressFromLocation(LatLng location) async {
    final filledFromWebLikeGeocoder = await _fillAddressFromNominatim(location);
    if (filledFromWebLikeGeocoder) return;

    // Fallback: device geocoder (useful if Nominatim is unavailable).
    try {
      final placemarks = await placemarkFromCoordinates(
        location.latitude,
        location.longitude,
      );
      if (placemarks.isEmpty || !mounted) return;

      final placemark = placemarks.first;
      final houseNo = _pickFirst([placemark.subThoroughfare]);
      final street = _pickFirst([placemark.thoroughfare, placemark.name]);
      final barangay = _pickFirst([
        placemark.subLocality,
        placemark.subAdministrativeArea,
      ]);
      final city = _pickFirst([
        placemark.locality,
        placemark.administrativeArea,
      ]);
      final province = _pickFirst([
        placemark.administrativeArea,
        placemark.subAdministrativeArea,
      ]);
      final postalCode = _pickFirst([placemark.postalCode]);

      setState(() {
        if (houseNo.isNotEmpty) _houseNoController.text = houseNo;
        if (street.isNotEmpty) _streetController.text = street;
        if (barangay.isNotEmpty) _barangayController.text = barangay;
        if (city.isNotEmpty) _cityController.text = city;
        if (province.isNotEmpty) _provinceController.text = province;
        if (postalCode.isNotEmpty) _postalController.text = postalCode;
      });
    } catch (_) {
      // Keep the pin even if reverse geocoding is unavailable.
    }
  }

  Future<bool> _fillAddressFromNominatim(LatLng location) async {
    try {
      final response = await Dio().get<dynamic>(
        'https://nominatim.openstreetmap.org/reverse',
        queryParameters: {
          'format': 'json',
          'lat': location.latitude,
          'lon': location.longitude,
          'addressdetails': 1,
        },
        options: Options(
          headers: {
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': 'LumbaRongApp/1.0',
          },
        ),
      );

      if (response.data is! Map<String, dynamic> || !mounted) return false;
      final data = response.data as Map<String, dynamic>;
      if (data['address'] is! Map) return false;
      final addr = Map<String, dynamic>.from(data['address'] as Map);

      final houseNumber = (addr['house_number'] ?? '').toString().trim();
      final road = _pickFirst([
        addr['road']?.toString(),
        addr['pedestrian']?.toString(),
        addr['neighbourhood']?.toString(),
      ]);
      final street = road;
      final barangay = _pickFirst([
        addr['suburb']?.toString(),
        addr['quarter']?.toString(),
        addr['village']?.toString(),
      ]);
      final city = _pickFirst([
        addr['city']?.toString(),
        addr['town']?.toString(),
        addr['municipality']?.toString(),
      ]);
      final province = _pickFirst([
        addr['state']?.toString(),
        addr['region']?.toString(),
        addr['county']?.toString(),
      ]);
      final postalCode = (addr['postcode'] ?? '').toString().trim();

      setState(() {
        if (houseNumber.isNotEmpty) _houseNoController.text = houseNumber;
        if (street.isNotEmpty) _streetController.text = street;
        if (barangay.isNotEmpty) _barangayController.text = barangay;
        if (city.isNotEmpty) _cityController.text = city;
        if (province.isNotEmpty) _provinceController.text = province;
        if (postalCode.isNotEmpty) _postalController.text = postalCode;
      });

      return true;
    } catch (_) {
      return false;
    }
  }

  String _pickFirst(List<String?> values) {
    for (final value in values) {
      final text = value?.trim() ?? '';
      if (text.isNotEmpty) return text;
    }
    return '';
  }

  Widget _buildMapToggle() {
    final hasPin = _selectedLocation != null;
    final hasSelection = _mapSelection != null;
    return Align(
      alignment: Alignment.centerLeft,
      child: OutlinedButton.icon(
        onPressed: () => setState(() => _showMapPicker = !_showMapPicker),
        icon: Icon(
          Icons.location_on_outlined,
          color: hasPin ? Colors.green : AppTheme.primary,
        ),
        label: Text(
          hasPin
              ? 'Location pinned (${_selectedLocation!.latitude.toStringAsFixed(4)})'
              : hasSelection
              ? 'Map point selected'
              : (_showMapPicker ? 'Hide map picker' : 'Drop precise map pin'),
          style: const TextStyle(fontWeight: FontWeight.w900),
        ),
        style: OutlinedButton.styleFrom(
          foregroundColor: hasPin ? Colors.green : AppTheme.primary,
          side: BorderSide(color: hasPin ? Colors.green : AppTheme.primary),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
        ),
      ),
    );
  }

  Widget _buildMapPicker() {
    final center = _mapSelection ?? _selectedLocation ?? _defaultCenter;
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
            child: Row(
              children: [
                const Icon(
                  Icons.map_outlined,
                  size: 18,
                  color: AppTheme.primary,
                ),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'Interactive Map Pin',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1,
                      color: AppTheme.charcoal,
                    ),
                  ),
                ),
                if (_selectedLocation != null)
                  Text(
                    '${_selectedLocation!.latitude.toStringAsFixed(4)}, ${_selectedLocation!.longitude.toStringAsFixed(4)}',
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.textMuted,
                    ),
                  ),
                if (_selectedLocation == null && _mapSelection != null)
                  Text(
                    'Selected: ${_mapSelection!.latitude.toStringAsFixed(4)}, ${_mapSelection!.longitude.toStringAsFixed(4)}',
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.textMuted,
                    ),
                  ),
              ],
            ),
          ),
          ClipRRect(
            borderRadius: const BorderRadius.vertical(
              bottom: Radius.circular(24),
            ),
            child: SizedBox(
              height: 280,
              child: FlutterMap(
                mapController: _mapController,
                options: MapOptions(
                  initialCenter: center,
                  initialZoom:
                      _selectedLocation == null && _mapSelection == null
                      ? 13
                      : 15,
                  onTap: (tapPosition, point) {
                    _setPinnedLocation(point);
                  },
                ),
                children: [
                  TileLayer(
                    urlTemplate:
                        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'com.lumbarong.flutter_app',
                  ),
                  if (_mapSelection != null)
                    MarkerLayer(
                      markers: [
                        Marker(
                          point: _mapSelection!,
                          width: 48,
                          height: 48,
                          child: const Icon(
                            Icons.location_pin,
                            size: 48,
                            color: AppTheme.primary,
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (_reverseGeocoding)
                  const Text(
                    'Resolving address...',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.textMuted,
                    ),
                  )
                else if (_selectedLocation == null && _mapSelection == null)
                  const Text(
                    'Tap a point on the map, then press Pin Address to fill the fields above.',
                    style: TextStyle(
                      fontSize: 11,
                      color: AppTheme.textMuted,
                      height: 1.4,
                    ),
                  )
                else if (_selectedLocation == null && _mapSelection != null)
                  const Text(
                    'Point selected. Press Pin Address to use it.',
                    style: TextStyle(
                      fontSize: 11,
                      color: AppTheme.textMuted,
                      height: 1.4,
                    ),
                  )
                else
                  Text(
                    'Pinned at ${_selectedLocation!.latitude.toStringAsFixed(5)}, ${_selectedLocation!.longitude.toStringAsFixed(5)}',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: Colors.green,
                    ),
                  ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _mapSelection == null || _reverseGeocoding
                            ? null
                            : _confirmPinnedLocation,
                        icon: const Icon(Icons.push_pin_outlined, size: 18),
                        label: const Text('Pin Address'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(18),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    TextButton(
                      onPressed:
                          (_selectedLocation == null && _mapSelection == null)
                          ? null
                          : () => setState(() {
                              _selectedLocation = null;
                              _mapSelection = null;
                              _houseNoController.clear();
                              _streetController.clear();
                              _barangayController.clear();
                              _cityController.clear();
                              _provinceController.clear();
                              _postalController.clear();
                            }),
                      child: const Text('Clear pin'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
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
