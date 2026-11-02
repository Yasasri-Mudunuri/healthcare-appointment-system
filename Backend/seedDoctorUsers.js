const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const User = require("./models/User");

const sampleDoctors = [
  // Vijayawada
  { name: "Dr. Rajesh Kumar", email: "rajesh@healthcare.com", specialization: "Cardiologist", experience: "10 Years", fee: 500, hospital: "Apollo Hospitals", address: "MG Road, Vijayawada" },
  { name: "Dr. Priya Sharma", email: "priya@healthcare.com", specialization: "Dermatologist", experience: "8 Years", fee: 400, hospital: "Care Hospitals", address: "Governorpet, Vijayawada" },
  { name: "Dr. Vikram Singh", email: "vikram@healthcare.com", specialization: "Dentist", experience: "10 Years", fee: 350, hospital: "Manipal Hospitals", address: "Benz Circle, Vijayawada"},

  // Visakhapatnam
  { name: "Dr. Arun Reddy", email: "arun@healthcare.com", specialization: "Neurologist", experience: "12 Years", fee: 700, hospital: "KIMS Hospitals", address: "Siripuram, Visakhapatnam" },
  { name: "Dr. Anu Radha", email: "anu@healthcare.com", specialization: "Gynaecologist", experience: "15 Years", fee: 600, hospital: "Seven Hills Hospital", address: "Rockdale Layout, Visakhapatnam" },
  { name: "Dr. Kiran Kumar", email: "kiran@healthcare.com", specialization: "General Physician", experience: "6 Years", fee: 300, hospital: "Apollo Hospitals", address: "Dwaraka Nagar, Visakhapatnam" },
  { name: "Dr. Sneha Reddy", email: "sneha@healthcare.com", specialization: "Psychiatrist", experience: "8 Years", fee: 650, hospital: "Global Hospitals", address: "MVP Colony, Visakhapatnam" },

  // Hyderabad
  { name: "Dr. Suresh Babu", email: "suresh@healthcare.com", specialization: "Orthopedic", experience: "9 Years", fee: 550, hospital: "Care Hospitals", address: "Banjara Hills, Hyderabad" },
  { name: "Dr. Lakshmi Narayana", email: "lakshmi@healthcare.com", specialization: "Pediatrician", experience: "11 Years", fee: 450, hospital: "Rainbow Children's Hospital", address: "Kondapur, Hyderabad" },
  { name: "Dr. Meena Iyer", email: "meena@healthcare.com", specialization: "ENT Specialist", experience: "7 Years", fee: 400, hospital: "Yashoda Hospitals", address: "Somajiguda, Hyderabad" },

  // Guntur
  { name: "Dr. Ramesh Chandra", email: "ramesh@healthcare.com", specialization: "Cardiologist", experience: "14 Years", fee: 550, hospital: "Kims Icon Hospital", address: "Lakshmipuram, Guntur" },
  { name: "Dr. Divya Prasad", email: "divya@healthcare.com", specialization: "Dermatologist", experience: "6 Years", fee: 380, hospital: "Manipal Hospitals", address: "Brodipet, Guntur" },
  { name: "Dr. Naveen Rao", email: "naveen@healthcare.com", specialization: "Orthopedic", experience: "9 Years", fee: 500, hospital: "Andhra Hospitals", address: "Arundelpet, Guntur" },

  // Tirupati
  { name: "Dr. Harika Devi", email: "harika@healthcare.com", specialization: "Gynaecologist", experience: "10 Years", fee: 550, hospital: "SVIMS Hospital", address: "Alipiri Road, Tirupati" },
  { name: "Dr. Srinivas Raju", email: "srinivas@healthcare.com", specialization: "General Physician", experience: "13 Years", fee: 350, hospital: "Apollo Hospitals", address: "Tiruchanoor Road, Tirupati" },
  { name: "Dr. Deepika Menon", email: "deepika@healthcare.com", specialization: "Pediatrician", experience: "7 Years", fee: 400, hospital: "Ruia Hospital", address: "AIR Bypass Road, Tirupati" },

  // Vizianagaram
  { name: "Dr. Prasad Rao", email: "prasad@healthcare.com", specialization: "ENT Specialist", experience: "8 Years", fee: 380, hospital: "Government General Hospital", address: "Fort Road, Vizianagaram" },
  { name: "Dr. Swapna Latha", email: "swapna@healthcare.com", specialization: "Dentist", experience: "6 Years", fee: 300, hospital: "City Dental Care", address: "Ramachandrapuram, Vizianagaram" },

  // Kakinada
  { name: "Dr. Mahesh Varma", email: "mahesh@healthcare.com", specialization: "Neurologist", experience: "11 Years", fee: 620, hospital: "Konaseema Institute", address: "Jagannaickpur, Kakinada" },
  { name: "Dr. Sowmya Reddy", email: "sowmya@healthcare.com", specialization: "Psychiatrist", experience: "9 Years", fee: 500, hospital: "Government Hospital", address: "Suryaraopeta, Kakinada" },
];

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected — Seeding doctor users...");

    const hashedPassword = await bcrypt.hash("doctor123", 10);

    for (const doc of sampleDoctors) {
      const existing = await User.findOne({ email: doc.email });
      if (existing) {
        console.log(`Skipping (already exists): ${doc.email}`);
        continue;
      }

      await User.create({
        ...doc,
        password: hashedPassword,
        role: "doctor",
      });
    }

    console.log("Doctor users seeded successfully ✅ (login password: doctor123)");
    mongoose.connection.close();
  })
  .catch((err) => console.log("Error:", err));