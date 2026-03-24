const Subject = require("../models/Subject");

// Get all subjects
exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ createdAt: 1 });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a new subject (admin only)
exports.addSubject = async (req, res) => {
  try {
    const { name, icon } = req.body;

    // Check if subject already exists
    const existingSubject = await Subject.findOne({ name });
    if (existingSubject) {
      return res.status(400).json({ message: "Subject already exists" });
    }

    const subject = new Subject({ name, icon });
    await subject.save();
    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a subject (admin only)
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }
    res.json({ message: "Subject deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Initialize default subjects if none exist
exports.initDefaultSubjects = async () => {
  try {
    const count = await Subject.countDocuments();
    if (count === 0) {
      const defaultSubjects = [
        { name: "Computer Network", icon: "💻" },
        { name: "OOPS", icon: "🔄" },
        { name: "Automata", icon: "⚙️" },
        { name: "General", icon: "📝" },
      ];
      await Subject.insertMany(defaultSubjects);
      console.log("Default subjects initialized");
    }
  } catch (error) {
    console.error("Error initializing default subjects:", error);
  }
};
