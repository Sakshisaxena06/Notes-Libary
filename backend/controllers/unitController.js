import Unit from "../models/Unit.js";

// @desc    Get all units
export const getUnits = async (req, res) => {
  try {
    const { subject } = req.query;
    let query = {};

    if (subject) {
      query.subject = subject;
    }

    const units = await Unit.find(query).sort({
      subject: 1,
      order: 1,
      name: 1,
    });
    res.json(units);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get units by subject
export const getUnitsBySubject = async (req, res) => {
  try {
    const units = await Unit.find({ subject: req.params.subject }).sort({
      order: 1,
      name: 1,
    });
    res.json(units);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new unit
export const createUnit = async (req, res) => {
  try {
    const { name, subject, icon, order } = req.body;

    if (!name || !subject) {
      return res
        .status(400)
        .json({ message: "Unit name and subject are required" });
    }

    // Check if unit already exists for this subject
    const existingUnit = await Unit.findOne({ name, subject });
    if (existingUnit) {
      return res
        .status(400)
        .json({ message: "Unit already exists for this subject" });
    }

    const unit = new Unit({
      name,
      subject,
      icon: icon || "📚",
      order: order || 0,
    });

    const createdUnit = await unit.save();
    res.status(201).json(createdUnit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update unit
export const updateUnit = async (req, res) => {
  try {
    const { name, subject, icon, order } = req.body;

    const unit = await Unit.findById(req.params.id);

    if (unit) {
      unit.name = name || unit.name;
      unit.subject = subject || unit.subject;
      unit.icon = icon || unit.icon;
      unit.order = order !== undefined ? order : unit.order;

      const updatedUnit = await unit.save();
      res.json(updatedUnit);
    } else {
      res.status(404).json({ message: "Unit not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete unit
export const deleteUnit = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);

    if (unit) {
      await unit.deleteOne();
      res.json({ message: "Unit removed" });
    } else {
      res.status(404).json({ message: "Unit not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
