import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import pg from "pg";

const { Client } = pg;

const ARTIFACT_DIR =
  "/home/mashrafi47/snap/antigravity-cli/common/.gemini/antigravity-cli/brain/95794ae3-8ed9-4757-b5fa-f7c8216c07fd";

const DEMO_IMAGE_MAP = [
  {
    src: "event_cybersprint_1795750558254.jpg",
    dest: "event-cybersprint.jpg",
    fallback: "/images/achievements/achievement2.jpg",
  },
  {
    src: "event_ai_summit_1795750560104.jpg",
    dest: "event-ai-summit.jpg",
    fallback: "/images/achievements/achievement5.jpg",
  },
  {
    src: "event_design_jam_1795750569781.jpg",
    dest: "event-design-jam.jpg",
    fallback: "/images/achievements/achievement4.jpg",
  },
  {
    src: "post_ai_agents_1795750572191.jpg",
    dest: "post-ai-agents.jpg",
    fallback: "/images/achievements/achievement1.jpg",
  },
  {
    src: "post_cybersecurity_1795750558857.jpg",
    dest: "post-cybersecurity.jpg",
    fallback: "/images/achievements/achievement6.jpg",
  },
  {
    src: "post_web_engineering_1795750562279.jpg",
    dest: "post-web-engineering.jpg",
    fallback: "/images/achievements/achievement7.jpeg",
  },
];

function ensureDemoImages() {
  const demoDir = path.join(process.cwd(), "public", "images", "demo");
  fs.mkdirSync(demoDir, { recursive: true });
  const resolved = {};

  for (const item of DEMO_IMAGE_MAP) {
    const targetPath = path.join(demoDir, item.dest);
    const artifactPath = path.join(ARTIFACT_DIR, item.src);
    if (!fs.existsSync(targetPath) && fs.existsSync(artifactPath)) {
      fs.copyFileSync(artifactPath, targetPath);
    }
    resolved[item.dest] = fs.existsSync(targetPath)
      ? `/images/demo/${item.dest}`
      : item.fallback;
  }

  return resolved;
}

function daysFromNow(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function buildDemoEvents(img) {
  return [
    {
      slug: "cybersprint-4-0",
      name: "CyberSprint 4.0 — National Tech Fest",
      description:
        "MCPIC's flagship annual inter-college IT & computing festival uniting coders, hackers, and innovators for competitive programming, a 24-hour web hackathon, and Capture The Flag cybersecurity battles.",
      image_url: img["event-cybersprint.jpg"],
      start_date: daysFromNow(14),
      end_date: daysFromNow(16),
      segments: [
        {
          name: "Competitive Programming Arena",
          description:
            "A 3-hour algorithmic coding showdown testing data structures, dynamic programming, graph theory, and speed across C++, Python, and JavaScript. Open to both junior and senior divisions.",
          image_url: img["post-ai-agents.jpg"],
          start_date: daysFromNow(14),
          end_date: daysFromNow(14),
          registration_open: true,
          registration_deadline: daysFromNow(12),
          max_participants: 120,
          is_team_based: false,
          max_team_size: 1,
        },
        {
          name: "Full-Stack Web Hackathon",
          description:
            "Form a squad of up to 3 builders to design, code, and pitch a live web application solving a real campus or community challenge. Mentors and judges will evaluate architecture, UX, and impact.",
          image_url: img["post-web-engineering.jpg"],
          start_date: daysFromNow(15),
          end_date: daysFromNow(16),
          registration_open: true,
          registration_deadline: daysFromNow(13),
          max_participants: 40,
          is_team_based: true,
          max_team_size: 3,
        },
        {
          name: "Capture The Flag (CTF) Cyber Challenge",
          description:
            "Put your ethical hacking skills to the test across web exploitation, cryptography, OSINT, forensics, and reverse engineering challenges crafted by MCPIC security leads.",
          image_url: img["post-cybersecurity.jpg"],
          start_date: daysFromNow(16),
          end_date: daysFromNow(16),
          registration_open: true,
          registration_deadline: daysFromNow(13),
          max_participants: 50,
          is_team_based: true,
          max_team_size: 2,
        },
      ],
    },
    {
      slug: "ai-robotics-innovation-summit",
      name: "AI & Robotics Innovation Summit",
      description:
        "Dive into generative AI, computer vision, autonomous micro-bots, and hands-on machine learning labs designed for students ready to build tomorrow's intelligent systems.",
      image_url: img["event-ai-summit.jpg"],
      start_date: daysFromNow(28),
      end_date: daysFromNow(30),
      segments: [
        {
          name: "AI App & Prompt Engineering Sprint",
          description:
            "Build a practical AI-powered study companion, code assistant, or accessibility tool in 4 hours using modern LLM APIs and clean full-stack engineering.",
          image_url: img["post-ai-agents.jpg"],
          start_date: daysFromNow(28),
          end_date: daysFromNow(29),
          registration_open: true,
          registration_deadline: daysFromNow(25),
          max_participants: 60,
          is_team_based: true,
          max_team_size: 2,
        },
        {
          name: "Autonomous Line Follower & Robo-Track",
          description:
            "Calibrate your Arduino or ESP32 bot to navigate sharp curves, intersections, and timed speed zones on the official MCPIC robotics arena.",
          image_url: img["event-ai-summit.jpg"],
          start_date: daysFromNow(30),
          end_date: daysFromNow(30),
          registration_open: true,
          registration_deadline: daysFromNow(26),
          max_participants: 30,
          is_team_based: true,
          max_team_size: 3,
        },
      ],
    },
    {
      slug: "pixelcraft-design-jam",
      name: "PixelCraft — UI/UX & Digital Design Jam",
      description:
        "Where visual storytelling meets product design. Compete in Figma mobile app prototyping, Photoshop digital art, and short-form motion graphics.",
      image_url: img["event-design-jam.jpg"],
      start_date: daysFromNow(42),
      end_date: daysFromNow(43),
      segments: [
        {
          name: "UI/UX Product Redesign Challenge",
          description:
            "Transform a cluttered everyday app into an intuitive, accessible, modern interface in Figma. Judged on visual hierarchy, responsiveness, and thoughtful micro-interactions.",
          image_url: img["event-design-jam.jpg"],
          start_date: daysFromNow(42),
          end_date: daysFromNow(42),
          registration_open: true,
          registration_deadline: daysFromNow(39),
          max_participants: 80,
          is_team_based: false,
          max_team_size: 1,
        },
        {
          name: "Digital Poster & Motion Art",
          description:
            "Create an original futuristic tech artwork or 30-second motion sequence using Photoshop, Illustrator, Blender, or After Effects.",
          image_url: "/images/achievements/achievement4.jpg",
          start_date: daysFromNow(43),
          end_date: daysFromNow(43),
          registration_open: true,
          registration_deadline: daysFromNow(40),
          max_participants: 80,
          is_team_based: false,
          max_team_size: 1,
        },
      ],
    },
    {
      slug: "data-spreadsheet-olympiad",
      name: "MCPIC Data & Tech Olympiad",
      description:
        "Fast-paced analytical competition celebrating interactive Excel dashboards, real-world data visualization, and computer science trivia.",
      image_url: "/images/achievements/achievement3.jpg",
      start_date: daysFromNow(-12),
      end_date: daysFromNow(-10),
      segments: [
        {
          name: "Excel Analytics & Dashboard Finals",
          description:
            "Clean raw datasets, craft dynamic pivot tables, and build executive-grade visual dashboards under a 90-minute clock.",
          image_url: "/images/achievements/achievement3.jpg",
          start_date: daysFromNow(-12),
          end_date: daysFromNow(-11),
          registration_open: false,
          registration_deadline: daysFromNow(-14),
          max_participants: 100,
          is_team_based: false,
          max_team_size: 1,
        },
        {
          name: "IT & Computer Science Trivia Bowl",
          description:
            "Rapid-fire rounds covering computing history, networking, hardware architecture, AI breakthroughs, and logic puzzles.",
          image_url: "/images/achievements/achievement1.jpg",
          start_date: daysFromNow(-10),
          end_date: daysFromNow(-10),
          registration_open: false,
          registration_deadline: daysFromNow(-13),
          max_participants: 150,
          is_team_based: false,
          max_team_size: 1,
        },
      ],
    },
  ];
}

function buildDemoBlogs(img) {
  return [
    {
      slug: "how-ai-coding-agents-are-transforming-software-engineering",
      title: "How AI Coding Agents Are Transforming Software Engineering",
      publisher_name: "MCPIC Tech Editorial",
      image_url: img["post-ai-agents.jpg"],
      created_at: daysFromNow(-1),
      description: `A few years ago, AI in programming meant simple line-by-line autocomplete. Today, AI coding agents can plan architectures, trace multi-file bugs, write automated tests, and scaffold full-stack prototypes in minutes.

Does that mean learning computer science fundamentals no longer matters? Quite the opposite. When generating code becomes effortless, the most valuable skill in tech shifts to judgment: understanding how systems fit together, spotting subtle edge cases, designing clean database schemas, and auditing code for security vulnerabilities.

Here is how student developers at MCPIC can use AI as a superpower rather than a crutch:
1. Read every line before accepting it — ask "why does this work?" and "what happens if the input is malformed?"
2. Build strong foundations in data structures, networking, SQL, and Git so you can steer tools accurately.
3. Focus on real problems around your campus and community — shipping something people actually use teaches more than any tutorial.

The next generation of engineers will not be replaced by AI; they will be the builders who combine deep technical thinking with AI-accelerated execution to create ambitious projects faster than ever before.`,
    },
    {
      slug: "zero-trust-security-and-ethical-hacking-modern-web-apps",
      title: "Zero-Trust Security & Ethical Hacking: How Modern Web Apps Stay Safe",
      publisher_name: "Abdul Kadir Kabbo",
      image_url: img["post-cybersecurity.jpg"],
      created_at: daysFromNow(-3),
      description: `Every time you log into a website, submit a form, or register for an event, dozens of invisible security layers work together to protect your account. Yet most beginners only think about passwords — leaving apps exposed to real-world attacks.

In modern security engineering, we follow a "Zero-Trust" mindset: never trust input from the browser, and assume every single layer must defend itself independently.

Key defenses every aspiring web developer and ethical hacker should know:
• Parameterized SQL & Row Level Security (RLS): Prevent SQL Injection and ensure even a buggy query cannot leak another user's private records.
• CSRF & Strict CORS Protection: Block malicious third-party websites from secretly triggering actions while you are logged in.
• Two-Factor Authentication (TOTP MFA): Even if a password is leaked, a rotating 6-digit authenticator code stops account takeovers cold.
• Content Security Policy (CSP): Stops injected scripts (XSS) from ever executing in your users' browsers.

Want to learn cybersecurity hands-on? Join our upcoming Capture The Flag (CTF) segment at CyberSprint 4.0 — ethical hacking is one of the fastest-growing and most exciting careers in technology!`,
    },
    {
      slug: "inside-nextjs-and-edge-computing-why-milliseconds-matter",
      title: "Inside Next.js & Edge Computing: Why Milliseconds Matter on the Web",
      publisher_name: "Mashrafi Bin Nur",
      image_url: img["post-web-engineering.jpg"],
      created_at: daysFromNow(-6),
      description: `Have you ever clicked a link on a website, stared at a blank white screen for 5 seconds, and immediately hit the back button? Performance is not just a technical metric — it is the first impression of your product.

Modern frameworks like Next.js App Router completely rethink how web pages reach your screen:
• Server Components render HTML directly on the server with zero unnecessary JavaScript shipped to the browser.
• Smart Image Optimization automatically converts heavy multi-megabyte photos into lightweight WebP files sized specifically for your screen.
• Prefetching & Skeleton Loaders make route transitions feel instantaneous — like using a native desktop or mobile app.
• Zero-dependency animations powered by the browser's native IntersectionObserver keep scrolling locked at a silky 60fps without bloated third-party scripts.

Next time you build a web project, open Chrome DevTools' Network and Lighthouse tabs. Shaving seconds off load time is one of the most rewarding skills you can master as a full-stack developer.`,
    },
    {
      slug: "from-zero-to-your-first-hackathon-win-playbook",
      title: "From Zero to Your First Hackathon Win: A Student Builder's Playbook",
      publisher_name: "Aryan Kamal Aviv",
      image_url: img["event-cybersprint.jpg"],
      created_at: daysFromNow(-9),
      description: `Walking into your very first hackathon can feel intimidating — surrounded by glowing laptops, energy drinks, and ticking countdown clocks. Here is a secret most veterans know: winning teams rarely have the most complex code. They have the clearest focus.

Follow this 4-step playbook at your next tech fest:
1. Pick ONE sharp problem: Don't try to build a 12-feature super-app in 24 hours. Solve one real pain point extraordinarily well.
2. Split ownership early: Assign clear lanes — UI/design, core backend/data, and live demo/pitch — so nobody blocks anyone else.
3. Ship a working vertical slice by hour 6: A deployed, clickable prototype beats 20 unfinished features every single time.
4. Tell a story in your 3-minute pitch: Show the real user problem, walk through the live demo (never just static slides!), and explain what makes your technical approach smart.

Whether you walk away with a trophy or not, a single weekend hackathon will level up your coding, teamwork, and confidence more than months of solo study.`,
    },
    {
      slug: "art-of-ui-ux-5-micro-interaction-secrets",
      title: "The Art of UI/UX: 5 Design Secrets That Make Websites Feel Alive",
      publisher_name: "Soyad Soroar",
      image_url: img["event-design-jam.jpg"],
      created_at: daysFromNow(-14),
      description: `Great technology deserves great design. You can build the smartest algorithm in the world, but if users cannot figure out where to click — or if the interface feels cramped and lifeless — nobody will stick around to experience it.

Five practical UI/UX upgrades you can apply to your next project today:
1. Contrast & Hierarchy First: Use bold display headings, calm body text, and generous whitespace so the eye instantly knows what matters most.
2. Design for Both Light & Dark Modes: True craftsmanship means balanced surfaces and readable contrast in bright daylight as well as midnight coding sessions.
3. Purposeful Micro-Interactions: Subtle hover lifts, smooth 60fps scroll reveals, and tactile button feedback make interfaces respond like physical objects.
4. Respect Motion Preferences: Always keep animations fast (200–600ms) and honor prefers-reduced-motion.
5. Instant Feedback Everywhere: Use skeleton loaders instead of jarring layout jumps, and clear inline alerts alongside toast notifications.

Curious about UI/UX, Figma, or visual storytelling? Register for PixelCraft Design Jam and bring your creative ideas to life!`,
    },
    {
      slug: "getting-started-with-robotics-arduino-and-tinyml",
      title: "Getting Started with Robotics, ESP32 & TinyML on a Student Budget",
      publisher_name: "Raiyan Hasan",
      image_url: img["event-ai-summit.jpg"],
      created_at: daysFromNow(-19),
      description: `Seeing code you wrote make a real physical motor spin, dodge an obstacle, or recognize a voice command is pure magic. And today, you don't need an expensive university lab to get started with robotics and embedded AI.

With a $5 ESP32 microcontroller, a few infrared or ultrasonic sensors, and free open-source tools, students can build:
• Autonomous line-following and maze-solving robots
• Smart IoT classroom monitors that stream live temperature, air quality, and energy metrics to a web dashboard
• TinyML gesture and sound classifiers running real neural networks directly on a chip smaller than a credit card — no cloud connection required!

Hardware teaches you to think about timing, power, physics, and real-world noise in ways pure software never can. Drop by the MCPIC AI & Robotics Innovation Summit to see live demos and build your first prototype with the club.`,
    },
  ];
}

const DEFAULT_ACHIEVEMENTS = [
  { title: "Inter-College IT Olympiad Triumph", tag: "National Recognition", image_url: "/images/achievements/achievement1.jpg", year: "2024", display_order: 1 },
  { title: "Tech Fest Championship Showcase", tag: "Team Excellence", image_url: "/images/achievements/achievement2.jpg", year: "2024", display_order: 2 },
  { title: "Programming & Problem Solving", tag: "Coding Arena", image_url: "/images/achievements/achievement3.jpg", year: "2024", display_order: 3 },
  { title: "Creative Design & Multimedia Award", tag: "Digital Arts", image_url: "/images/achievements/achievement4.jpg", year: "2023", display_order: 4 },
  { title: "Institutional Innovation Honors", tag: "Innovation", image_url: "/images/achievements/achievement5.jpg", year: "2023", display_order: 5 },
  { title: "MCPIC Flagship Competition Moments", tag: "Community Pride", image_url: "/images/achievements/achievement6.jpg", year: "2024", display_order: 6 },
  { title: "Rising Tech Leaders Recognition", tag: "Hall of Fame", image_url: "/images/achievements/achievement7.jpeg", year: "2025", display_order: 7 },
];

const BLANK = "/images/blank.webp";

const DEFAULT_EXECUTIVES = [
  // 2025-2026
  { year: "2025-2026", name: "Aryan Kamal Aviv", post: "President", image: "/images/panel25to26/aryan-kamal-aviv.jpg" },
  { year: "2025-2026", name: "Raiyan Hasan", post: "Vice President", image: "/images/panel25to26/Raiyan-Hasan.jpg" },
  { year: "2025-2026", name: "Proloy Charushi", post: "Vice President", image: "/images/panel25to26/Proloy-Charushi.jpeg" },
  { year: "2025-2026", name: "Maisha Majed", post: "Secretary", image: "/images/panel25to26/Maisha-Majed.jpeg" },
  { year: "2025-2026", name: "Tasnim Zerin Ohana", post: "Assistant Secretary", image: "/images/panel25to26/Tasnim-Zerin-Ohana.jpeg" },
  { year: "2025-2026", name: "Zaima Khanam Warda", post: "Joint Secretary", image: "/images/panel25to26/Zaima-Khanam-Warda.jpg" },
  { year: "2025-2026", name: "Abdul Kadir Kabbo", post: "IT Head", image: "/images/panel25to26/abdul-kadir-kabbo.jpeg" },
  { year: "2025-2026", name: "Soyad Soroar", post: "Head of Content", image: "/images/panel25to26/Soyad-Soroar.webp" },
  { year: "2025-2026", name: "Tasfiah Tasnim", post: "Treasurer", image: "/images/panel25to26/Tasfiah-Tasnim.webp" },
  { year: "2025-2026", name: "Afrida Ahnaf Chowdhury Bevor", post: "Organizing Secretary", image: "/images/panel25to26/Afrida-Ahnaf-Chowdhury-Bevor.jpg" },
  { year: "2025-2026", name: "Zarin Tasnim Nowshin", post: "Asst. Organizing Secretary", image: "/images/panel25to26/Zarin-Tasnim-Nowshin.webp" },
  { year: "2025-2026", name: "Arosh Bin Wahid", post: "Logistician", image: "/images/panel25to26/Arosh-Bin-Wahid.png" },
  { year: "2025-2026", name: "Tazwar Tausif", post: "Content Manager", image: "/images/panel25to26/Tazwar-Tausif.jpeg" },
  { year: "2025-2026", name: "Fuad Bin Qaium", post: "IT Officer", image: "/images/panel25to26/Fuad-Bin-Qaium.jpeg" },
  { year: "2025-2026", name: "Azora Islam Ohie", post: "Public Relations Officer", image: "/images/panel25to26/Azora-Islam-Ohie.jpeg" },
  { year: "2025-2026", name: "Sadia Mubash Shara", post: "Human Resources Manager", image: "/images/panel25to26/Sadia-Mubash-Sara.jpeg" },
  { year: "2025-2026", name: "Nazifa Sumaiya", post: "Executive", image: "/images/panel25to26/Nazifa-Sumaiya.jpeg" },
  // 2024-2025
  { year: "2024-2025", name: "Mahfuz Ahmed Likhon", post: "President", image: "/images/panel23to24/mahfuz.jpg" },
  { year: "2024-2025", name: "Tasniha Tanzil Zerin", post: "Vice President", image: BLANK },
  { year: "2024-2025", name: "Raiyan Hasan", post: "Vice President", image: "/images/panel/raiyan.jpg" },
  { year: "2024-2025", name: "Aryan Kamal Aviv", post: "Secretary", image: "/images/panel/aviv.png" },
  { year: "2024-2025", name: "Maisha Majed", post: "Assistant Secretary", image: "/images/panel23to24/maisha.jpg" },
  { year: "2024-2025", name: "Humayra Jahan Hridita", post: "Joint Secretary", image: BLANK },
  { year: "2024-2025", name: "Proloy Charushi", post: "IT Head", image: "/images/panel/proloy.jpg" },
  { year: "2024-2025", name: "Zarin Tasnim Nowshin", post: "Treasurer", image: "/images/panel22to23/nowshin.jpg" },
  { year: "2024-2025", name: "Afrida Ahnaf Chowdhury Bivor", post: "Organizing Secretary", image: BLANK },
  { year: "2024-2025", name: "Tasfiah Tasnim", post: "Assistant Organizing Secretary", image: "/images/panel23to24/tashfia.jpeg" },
  { year: "2024-2025", name: "Ahnaf Muttaki Adib", post: "Field Manager", image: "/images/panel/adib.jpg" },
  { year: "2024-2025", name: "Safayet Hossain Sabyoun", post: "Content Manager", image: BLANK },
  { year: "2024-2025", name: "Jerin Subah Aroni", post: "Content Manager", image: BLANK },
  { year: "2024-2025", name: "Azora Islam Ohie", post: "Public Relations Officer", image: "/images/panel23to24/azora.jpg" },
  { year: "2024-2025", name: "Sumormee Sumanto", post: "Information Technology Officer", image: BLANK },
  { year: "2024-2025", name: "Soyad Soroar", post: "Designer", image: BLANK },
  { year: "2024-2025", name: "Tasnim Zerin Ohana", post: "Executive", image: BLANK },
  { year: "2024-2025", name: "Abdul Kadir Kabbo", post: "IT Officer", image: BLANK },
  // 2023-2024
  { year: "2023-2024", name: "Afiun Nahar", post: "Moderator", image: BLANK },
  { year: "2023-2024", name: "Mashrafi Bin Nur", post: "Advisor", image: "/images/panel/mashrafi.jpg" },
  { year: "2023-2024", name: "MD. Arikuzzaman", post: "Advisor", image: "/images/panel/Arik.jpg" },
  { year: "2023-2024", name: "Samiul Haque Chowdhury", post: "Advisor", image: "/images/panel/samiulsami.jpg" },
  { year: "2023-2024", name: "Areeb Jawad", post: "President", image: "/images/panel/Areeb.jpg" },
  { year: "2023-2024", name: "MD. Fahad Hossain", post: "Vice President", image: "/images/panel/fahad.jpg" },
  { year: "2023-2024", name: "Abdullah Islam Sabiq", post: "General Secretary", image: "/images/panel/sabiq.jpeg" },
  { year: "2023-2024", name: "Raiyan Hasan", post: "Head of IT", image: "/images/panel/raiyan.jpg" },
  { year: "2023-2024", name: "MD. Salehin Alam", post: "Organizing Secretary", image: BLANK },
  { year: "2023-2024", name: "Proloy Charushi", post: "Asst. General Secretary", image: "/images/panel/proloy.jpg" },
  { year: "2023-2024", name: "Yasar Faqid Zaman", post: "Asst. Organizing Secretary", image: "/images/panel23to24/faqid.jpeg" },
  { year: "2023-2024", name: "Tasnia Naushin Ela", post: "Organizing Secretary", image: "/images/panel23to24/tasniha.jpg" },
  { year: "2023-2024", name: "Tashfia Tasnim", post: "Public Relations Officer", image: "/images/panel23to24/tashfia.jpeg" },
  { year: "2023-2024", name: "Ajwad Abrar", post: "Joint Secretary", image: "/images/panel/ajwadAbrar.jpeg" },
  { year: "2023-2024", name: "Soyad Sorower", post: "Media Councilor", image: BLANK },
  { year: "2023-2024", name: "Mustakim Nur Salin", post: "IT Secretary", image: BLANK },
  { year: "2023-2024", name: "Tasniha Tanzil Zerin", post: "IT Officer", image: "/images/panel23to24/tanzil-zerin.jpg" },
  { year: "2023-2024", name: "Azora Islam", post: "HR Manager", image: "/images/panel23to24/azora.jpg" },
  { year: "2023-2024", name: "Muhammad Irteza", post: "Designer", image: "/images/panel23to24/adnan.jpg" },
  { year: "2023-2024", name: "Maisha Majed", post: "Content Manager", image: "/images/panel23to24/maisha.jpg" },
  { year: "2023-2024", name: "Sazzatul Meraz Ayaan", post: "Executive", image: "/images/panel23to24/ayaan.jpeg" },
  { year: "2023-2024", name: "Mahfuz Ahmed Likhon", post: "IT Officer", image: "/images/panel23to24/mahfuz.jpg" },
  { year: "2023-2024", name: "Aryan Kamal Aviv", post: "Field Officer", image: "/images/panel/aviv.png" },
  { year: "2023-2024", name: "Ahnaf Muttaki Adib", post: "Field Officer", image: "/images/panel/adib.jpg" },
  // 2022-2023
  { year: "2022-2023", name: "Afiun Nahar", post: "Moderator", image: BLANK },
  { year: "2022-2023", name: "Mashrafi Bin Nur", post: "President", image: "/images/panel/mashrafi.jpg" },
  { year: "2022-2023", name: "MD. Arikuzzaman", post: "Vice President (Admin)", image: "/images/panel/Arik.jpg" },
  { year: "2022-2023", name: "Samiul Haque Chowdhury", post: "Vice President (Event)", image: "/images/panel/samiulsami.jpg" },
  { year: "2022-2023", name: "Raiyan Hasan", post: "Vice President (IT)", image: "/images/panel/raiyan.jpg" },
  { year: "2022-2023", name: "Abdullah Islam Sabiq", post: "General Secretary", image: "/images/panel/sabiq.jpeg" },
  { year: "2022-2023", name: "Zaima Khanam Warda", post: "Organizing Secretary", image: BLANK },
  { year: "2022-2023", name: "Ahnaf Muttaki Adib", post: "Treasurer", image: "/images/panel/adib.jpg" },
  { year: "2022-2023", name: "Fahad Hossain", post: "Field Officer", image: "/images/panel/fahad.jpg" },
  { year: "2022-2023", name: "Aryan Kamal Aviv", post: "Field Officer", image: "/images/panel/aviv.png" },
  { year: "2022-2023", name: "Tanzim Hasan Bhuiyan", post: "Event Manager", image: BLANK },
  { year: "2022-2023", name: "Afrida Ahnaf Chowdhury", post: "Public Relations Officer", image: BLANK },
  { year: "2022-2023", name: "Zarin Tasnim Nowshin", post: "Content Writer", image: "/images/panel22to23/nowshin.jpg" },
  { year: "2022-2023", name: "Areeb Jawad", post: "IT Secretary", image: "/images/panel/Areeb.jpg" },
  { year: "2022-2023", name: "Afsheen Iqbal", post: "Content Writer", image: BLANK },
  { year: "2022-2023", name: "Proloy Charushi", post: "Designer", image: "/images/panel/proloy.jpg" },
  { year: "2022-2023", name: "Ajwad Abrar", post: "Executive Member (IT)", image: "/images/panel/ajwadAbrar.jpeg" },
  { year: "2022-2023", name: "Junaira Mehreen", post: "Executive Member (IT)", image: "/images/panel/mehreen.jpg" },
  { year: "2022-2023", name: "Faria Afrin Raisa", post: "Executive Member (Admin)", image: BLANK },
  { year: "2022-2023", name: "Mahdi Ashyam", post: "Executive Member (Event)", image: BLANK },
  { year: "2022-2023", name: "Israt Jahan Labiba", post: "Executive Member", image: "/images/panel22to23/labiba.jpeg" },
  { year: "2022-2023", name: "Riad Amin", post: "Executive Member (Admin)", image: BLANK },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("ERROR: Set DATABASE_URL in .env.local");
    process.exit(1);
  }

  const email = (process.env.SEED_ADMIN_EMAIL || "admin@mcpscictclub.com")
    .trim()
    .toLowerCase();
  const name = (process.env.SEED_ADMIN_NAME || "MCPIC Admin").trim();

  let password = process.env.SEED_ADMIN_PASSWORD || "";
  let generated = false;
  if (!password) {
    password = `Mc!${crypto.randomBytes(12).toString("base64url")}9`;
    generated = true;
  }
  if (password.length < 12) {
    console.error("ERROR: SEED_ADMIN_PASSWORD must be at least 12 characters.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.user_role', 'system', true)");

    const existing = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      await client.query(
        `UPDATE users
         SET role = 'admin', designation = 'Advisor', email_verified_at = COALESCE(email_verified_at, NOW())
         WHERE email = $1`,
        [email]
      );
      console.log(`Admin account already exists; verified admin role for ${email}.`);
    } else {
      await client.query(
        `INSERT INTO users (email, name, password_hash, role, designation, email_verified_at)
         VALUES ($1, $2, $3, 'admin', 'Advisor', NOW())`,
        [email, name, passwordHash]
      );
      console.log(`Created initial admin account: ${email}`);
      if (generated) {
        console.log("One-time generated password (store securely and enable MFA immediately):");
        console.log(password);
      }
    }

    await client.query(
      `INSERT INTO site_settings (key, value)
       VALUES ('recruitment', '{"enabled": false}'::JSONB)
       ON CONFLICT (key) DO NOTHING`
    );

    // Seed Achievements if table is empty
    const achCount = await client.query("SELECT COUNT(*)::int AS count FROM achievements");
    if ((achCount.rows[0]?.count ?? 0) === 0) {
      for (const item of DEFAULT_ACHIEVEMENTS) {
        await client.query(
          `INSERT INTO achievements (title, tag, image_url, year, display_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [item.title, item.tag, item.image_url, item.year, item.display_order]
        );
      }
      console.log(`Seeded ${DEFAULT_ACHIEVEMENTS.length} achievements.`);
    }

    // Seed Executive Committee panels if table is empty
    const execCount = await client.query("SELECT COUNT(*)::int AS count FROM executive_members");
    if ((execCount.rows[0]?.count ?? 0) === 0) {
      const orderByYear = new Map();
      for (const m of DEFAULT_EXECUTIVES) {
        const nextOrder = (orderByYear.get(m.year) ?? 0) + 1;
        orderByYear.set(m.year, nextOrder);
        await client.query(
          `INSERT INTO executive_members (panel_year, name, post, image_url, display_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [m.year, m.name, m.post, m.image, nextOrder]
        );
      }
      console.log(`Seeded ${DEFAULT_EXECUTIVES.length} executive committee members.`);
    }

    // Copy bespoke demo cover artwork into public/images/demo/ (or gracefully fall back)
    const demoImages = ensureDemoImages();

    const adminRow = await client.query("SELECT id, name FROM users WHERE email = $1 LIMIT 1", [
      email,
    ]);
    const adminId = adminRow.rows[0]?.id ?? null;
    const adminName = adminRow.rows[0]?.name ?? name;

    // Seed Demo Events & Segments (idempotent by slug / event_id + name)
    const demoEvents = buildDemoEvents(demoImages);
    let insertedEvents = 0;
    let insertedSegments = 0;

    for (const ev of demoEvents) {
      const evRes = await client.query(
        `INSERT INTO events (slug, name, description, image_url, start_date, end_date, created_by, created_by_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (slug) DO NOTHING
         RETURNING id`,
        [
          ev.slug,
          ev.name,
          ev.description,
          ev.image_url,
          ev.start_date,
          ev.end_date,
          adminId,
          adminName,
        ]
      );

      let eventId = evRes.rows[0]?.id;
      if (eventId) {
        insertedEvents++;
      } else {
        const existingEv = await client.query("SELECT id FROM events WHERE slug = $1 LIMIT 1", [
          ev.slug,
        ]);
        eventId = existingEv.rows[0]?.id;
      }

      if (eventId) {
        for (const seg of ev.segments) {
          const existsSeg = await client.query(
            "SELECT id FROM segments WHERE event_id = $1 AND name = $2 LIMIT 1",
            [eventId, seg.name]
          );
          if (!existsSeg.rowCount || existsSeg.rowCount === 0) {
            await client.query(
              `INSERT INTO segments
                (event_id, name, description, image_url, start_date, end_date,
                 registration_open, registration_deadline, max_participants, is_team_based, max_team_size)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
              [
                eventId,
                seg.name,
                seg.description,
                seg.image_url,
                seg.start_date,
                seg.end_date,
                seg.registration_open,
                seg.registration_deadline,
                seg.max_participants,
                seg.is_team_based,
                seg.max_team_size,
              ]
            );
            insertedSegments++;
          }
        }
      }
    }
    if (insertedEvents > 0 || insertedSegments > 0) {
      console.log(`Seeded ${insertedEvents} demo events and ${insertedSegments} event segments.`);
    }

    // Seed Engaging Tech Blog Posts (idempotent by slug)
    const demoBlogs = buildDemoBlogs(demoImages);
    let insertedBlogs = 0;
    for (const post of demoBlogs) {
      const blogRes = await client.query(
        `INSERT INTO blogs (slug, title, description, image_url, publisher_id, publisher_name, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (slug) DO NOTHING
         RETURNING id`,
        [
          post.slug,
          post.title,
          post.description,
          post.image_url,
          adminId,
          post.publisher_name,
          post.created_at,
        ]
      );
      if (blogRes.rowCount && blogRes.rowCount > 0) {
        insertedBlogs++;
      }
    }
    if (insertedBlogs > 0) {
      console.log(`Seeded ${insertedBlogs} tech blog posts.`);
    }

    await client.query("COMMIT");
    console.log("Seed completed successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
