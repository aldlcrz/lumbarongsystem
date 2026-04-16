const Address = require('../models/Address');
const { validateAddressPayload } = require('../utils/inputValidation');

exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.findAll({
      where: { userId: req.user.id },
      order: [['isDefault', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch addresses' });
  }
};

exports.createAddress = async (req, res) => {
  try {
    const { isDefault } = req.body;
    const normalizedAddress = validateAddressPayload(req.body);

    if (isDefault) {
      await Address.update({ isDefault: false }, { where: { userId: req.user.id } });
    }

    const address = await Address.create({
      recipientName: normalizedAddress.recipientName,
      phone: normalizedAddress.phone,
      houseNo: normalizedAddress.houseNo,
      street: normalizedAddress.street,
      barangay: normalizedAddress.barangay,
      city: normalizedAddress.city,
      province: normalizedAddress.province,
      postalCode: normalizedAddress.postalCode,
      userId: req.user.id,
      latitude: normalizedAddress.latitude,
      longitude: normalizedAddress.longitude,
      isDefault: isDefault || false
    });

    res.status(201).json(address);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!address) return res.status(404).json({ message: 'Address not found' });

    const { isDefault } = req.body;
    const normalizedAddress = validateAddressPayload({
      recipientName: req.body.recipientName ?? address.recipientName,
      phone: req.body.phone ?? address.phone,
      houseNo: req.body.houseNo ?? address.houseNo,
      street: req.body.street ?? address.street,
      barangay: req.body.barangay ?? address.barangay,
      city: req.body.city ?? address.city,
      province: req.body.province ?? address.province,
      postalCode: req.body.postalCode ?? address.postalCode,
      latitude: req.body.latitude ?? address.latitude,
      longitude: req.body.longitude ?? address.longitude,
    });

    if (isDefault && !address.isDefault) {
      await Address.update({ isDefault: false }, { where: { userId: req.user.id } });
    }

    await address.update({
      ...normalizedAddress,
      isDefault: isDefault ?? address.isDefault,
    });
    res.json(address);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!address) return res.status(404).json({ message: 'Address not found' });

    await address.destroy();
    res.json({ message: 'Address deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete address' });
  }
};

exports.setDefaultAddress = async (req, res) => {
  try {
    await Address.update({ isDefault: false }, { where: { userId: req.user.id } });
    const address = await Address.update({ isDefault: true }, {
      where: { id: req.params.id, userId: req.user.id }
    });
    res.json({ message: 'Default address updated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update default address' });
  }
};
