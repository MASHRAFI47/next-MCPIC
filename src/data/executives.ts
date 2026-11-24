export interface ExecutiveMember {
  id: string;
  name: string;
  post: string;
  image: string;
}

export interface ExecutivePanel {
  year: string;
  members: ExecutiveMember[];
}

const BLANK = "/images/blank.webp";

export const EXECUTIVE_PANELS: ExecutivePanel[] = [
  {
    year: "2025-2026",
    members: [
      { id: "25-1", name: "Aryan Kamal Aviv", post: "President", image: "/images/panel25to26/aryan-kamal-aviv.jpg" },
      { id: "25-2", name: "Raiyan Hasan", post: "Vice President", image: "/images/panel25to26/Raiyan-Hasan.jpg" },
      { id: "25-3", name: "Proloy Charushi", post: "Vice President", image: "/images/panel25to26/Proloy-Charushi.jpeg" },
      { id: "25-4", name: "Maisha Majed", post: "Secretary", image: "/images/panel25to26/Maisha-Majed.jpeg" },
      { id: "25-5", name: "Tasnim Zerin Ohana", post: "Assistant Secretary", image: "/images/panel25to26/Tasnim-Zerin-Ohana.jpeg" },
      { id: "25-6", name: "Zaima Khanam Warda", post: "Joint Secretary", image: "/images/panel25to26/Zaima-Khanam-Warda.jpg" },
      { id: "25-7", name: "Abdul Kadir Kabbo", post: "IT Head", image: "/images/panel25to26/abdul-kadir-kabbo.jpeg" },
      { id: "25-8", name: "Soyad Soroar", post: "Head of Content", image: "/images/panel25to26/Soyad-Soroar.webp" },
      { id: "25-9", name: "Tasfiah Tasnim", post: "Treasurer", image: "/images/panel25to26/Tasfiah-Tasnim.webp" },
      { id: "25-10", name: "Afrida Ahnaf Chowdhury Bevor", post: "Organizing Secretary", image: "/images/panel25to26/Afrida-Ahnaf-Chowdhury-Bevor.jpg" },
      { id: "25-11", name: "Zarin Tasnim Nowshin", post: "Asst. Organizing Secretary", image: "/images/panel25to26/Zarin-Tasnim-Nowshin.webp" },
      { id: "25-12", name: "Arosh Bin Wahid", post: "Logistician", image: "/images/panel25to26/Arosh-Bin-Wahid.png" },
      { id: "25-13", name: "Tazwar Tausif", post: "Content Manager", image: "/images/panel25to26/Tazwar-Tausif.jpeg" },
      { id: "25-14", name: "Fuad Bin Qaium", post: "IT Officer", image: "/images/panel25to26/Fuad-Bin-Qaium.jpeg" },
      { id: "25-15", name: "Azora Islam Ohie", post: "Public Relations Officer", image: "/images/panel25to26/Azora-Islam-Ohie.jpeg" },
      { id: "25-16", name: "Sadia Mubash Shara", post: "Human Resources Manager", image: "/images/panel25to26/Sadia-Mubash-Sara.jpeg" },
      { id: "25-17", name: "Nazifa Sumaiya", post: "Executive", image: "/images/panel25to26/Nazifa-Sumaiya.jpeg" },
    ],
  },
  {
    year: "2024-2025",
    members: [
      { id: "24-1", name: "Mahfuz Ahmed Likhon", post: "President", image: "/images/panel23to24/mahfuz.jpg" },
      { id: "24-2", name: "Tasniha Tanzil Zerin", post: "Vice President", image: BLANK },
      { id: "24-3", name: "Raiyan Hasan", post: "Vice President", image: "/images/panel/raiyan.jpg" },
      { id: "24-4", name: "Aryan Kamal Aviv", post: "Secretary", image: "/images/panel/aviv.png" },
      { id: "24-5", name: "Maisha Majed", post: "Assistant Secretary", image: "/images/panel23to24/maisha.jpg" },
      { id: "24-6", name: "Humayra Jahan Hridita", post: "Joint Secretary", image: BLANK },
      { id: "24-7", name: "Proloy Charushi", post: "IT Head", image: "/images/panel/proloy.jpg" },
      { id: "24-8", name: "Zarin Tasnim Nowshin", post: "Treasurer", image: "/images/panel22to23/nowshin.jpg" },
      { id: "24-9", name: "Afrida Ahnaf Chowdhury Bivor", post: "Organizing Secretary", image: BLANK },
      { id: "24-10", name: "Tasfiah Tasnim", post: "Assistant Organizing Secretary", image: "/images/panel23to24/tashfia.jpeg" },
      { id: "24-11", name: "Ahnaf Muttaki Adib", post: "Field Manager", image: "/images/panel/adib.jpg" },
      { id: "24-12", name: "Safayet Hossain Sabyoun", post: "Content Manager", image: BLANK },
      { id: "24-13", name: "Jerin Subah Aroni", post: "Content Manager", image: BLANK },
      { id: "24-14", name: "Azora Islam Ohie", post: "Public Relations Officer", image: "/images/panel23to24/azora.jpg" },
      { id: "24-15", name: "Sumormee Sumanto", post: "Information Technology Officer", image: BLANK },
      { id: "24-16", name: "Soyad Soroar", post: "Designer", image: BLANK },
      { id: "24-17", name: "Tasnim Zerin Ohana", post: "Executive", image: BLANK },
      { id: "24-18", name: "Abdul Kadir Kabbo", post: "IT Officer", image: BLANK },
    ],
  },
  {
    year: "2023-2024",
    members: [
      { id: "23-0", name: "Afiun Nahar", post: "Moderator", image: BLANK },
      { id: "23-1", name: "Mashrafi Bin Nur", post: "Advisor", image: "/images/panel/mashrafi.jpg" },
      { id: "23-2", name: "MD. Arikuzzaman", post: "Advisor", image: "/images/panel/Arik.jpg" },
      { id: "23-3", name: "Samiul Haque Chowdhury", post: "Advisor", image: "/images/panel/samiulsami.jpg" },
      { id: "23-4", name: "Areeb Jawad", post: "President", image: "/images/panel/Areeb.jpg" },
      { id: "23-5", name: "MD. Fahad Hossain", post: "Vice President", image: "/images/panel/fahad.jpg" },
      { id: "23-6", name: "Abdullah Islam Sabiq", post: "General Secretary", image: "/images/panel/sabiq.jpeg" },
      { id: "23-7", name: "Raiyan Hasan", post: "Head of IT", image: "/images/panel/raiyan.jpg" },
      { id: "23-8", name: "MD. Salehin Alam", post: "Organizing Secretary", image: BLANK },
      { id: "23-9", name: "Proloy Charushi", post: "Asst. General Secretary", image: "/images/panel/proloy.jpg" },
      { id: "23-10", name: "Yasar Faqid Zaman", post: "Asst. Organizing Secretary", image: "/images/panel23to24/faqid.jpeg" },
      { id: "23-11", name: "Tasnia Naushin Ela", post: "Organizing Secretary", image: "/images/panel23to24/tasniha.jpg" },
      { id: "23-12", name: "Tashfia Tasnim", post: "Public Relations Officer", image: "/images/panel23to24/tashfia.jpeg" },
      { id: "23-13", name: "Ajwad Abrar", post: "Joint Secretary", image: "/images/panel/ajwadAbrar.jpeg" },
      { id: "23-14", name: "Soyad Sorower", post: "Media Councilor", image: BLANK },
      { id: "23-15", name: "Mustakim Nur Salin", post: "IT Secretary", image: BLANK },
      { id: "23-16", name: "Tasniha Tanzil Zerin", post: "IT Officer", image: "/images/panel23to24/tanzil-zerin.jpg" },
      { id: "23-17", name: "Azora Islam", post: "HR Manager", image: "/images/panel23to24/azora.jpg" },
      { id: "23-18", name: "Muhammad Irteza", post: "Designer", image: "/images/panel23to24/adnan.jpg" },
      { id: "23-19", name: "Maisha Majed", post: "Content Manager", image: "/images/panel23to24/maisha.jpg" },
      { id: "23-20", name: "Sazzatul Meraz Ayaan", post: "Executive", image: "/images/panel23to24/ayaan.jpeg" },
      { id: "23-21", name: "Mahfuz Ahmed Likhon", post: "IT Officer", image: "/images/panel23to24/mahfuz.jpg" },
      { id: "23-22", name: "Aryan Kamal Aviv", post: "Field Officer", image: "/images/panel/aviv.png" },
      { id: "23-23", name: "Ahnaf Muttaki Adib", post: "Field Officer", image: "/images/panel/adib.jpg" },
    ],
  },
  {
    year: "2022-2023",
    members: [
      { id: "22-0", name: "Afiun Nahar", post: "Moderator", image: BLANK },
      { id: "22-1", name: "Mashrafi Bin Nur", post: "President", image: "/images/panel/mashrafi.jpg" },
      { id: "22-2", name: "MD. Arikuzzaman", post: "Vice President (Admin)", image: "/images/panel/Arik.jpg" },
      { id: "22-3", name: "Samiul Haque Chowdhury", post: "Vice President (Event)", image: "/images/panel/samiulsami.jpg" },
      { id: "22-4", name: "Raiyan Hasan", post: "Vice President (IT)", image: "/images/panel/raiyan.jpg" },
      { id: "22-5", name: "Abdullah Islam Sabiq", post: "General Secretary", image: "/images/panel/sabiq.jpeg" },
      { id: "22-6", name: "Zaima Khanam Warda", post: "Organizing Secretary", image: BLANK },
      { id: "22-7", name: "Ahnaf Muttaki Adib", post: "Treasurer", image: "/images/panel/adib.jpg" },
      { id: "22-8", name: "Fahad Hossain", post: "Field Officer", image: "/images/panel/fahad.jpg" },
      { id: "22-9", name: "Aryan Kamal Aviv", post: "Field Officer", image: "/images/panel/aviv.png" },
      { id: "22-10", name: "Tanzim Hasan Bhuiyan", post: "Event Manager", image: BLANK },
      { id: "22-11", name: "Afrida Ahnaf Chowdhury", post: "Public Relations Officer", image: BLANK },
      { id: "22-12", name: "Zarin Tasnim Nowshin", post: "Content Writer", image: "/images/panel22to23/nowshin.jpg" },
      { id: "22-13", name: "Areeb Jawad", post: "IT Secretary", image: "/images/panel/Areeb.jpg" },
      { id: "22-14", name: "Afsheen Iqbal", post: "Content Writer", image: BLANK },
      { id: "22-15", name: "Proloy Charushi", post: "Designer", image: "/images/panel/proloy.jpg" },
      { id: "22-16", name: "Ajwad Abrar", post: "Executive Member (IT)", image: "/images/panel/ajwadAbrar.jpeg" },
      { id: "22-17", name: "Junaira Mehreen", post: "Executive Member (IT)", image: "/images/panel/mehreen.jpg" },
      { id: "22-18", name: "Faria Afrin Raisa", post: "Executive Member (Admin)", image: BLANK },
      { id: "22-19", name: "Mahdi Ashyam", post: "Executive Member (Event)", image: BLANK },
      { id: "22-20", name: "Israt Jahan Labiba", post: "Executive Member", image: "/images/panel22to23/labiba.jpeg" },
      { id: "22-21", name: "Riad Amin", post: "Executive Member (Admin)", image: BLANK },
    ],
  },
];
