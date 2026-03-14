import { useState, useRef, useEffect } from "react";
import GridScan from "./GridScan.jsx";
import { DottedSurface } from "./components/ui/dotted-surface.jsx";

const SYSTEM_PROMPT = `You are "FirstGen Guide" — a warm, friendly, and knowledgeable college advisor specifically designed for first-generation college students.
Speak like a helpful older sibling who went to college. Never use jargon without explaining it. Never make the student feel stupid.
Cover: FAFSA, scholarships, GPA, credit hours, syllabus, office hours, professor emails, internships, resume, networking, dorm life, imposter syndrome, mental health, food insecurity, work-study, recommendation letters, dropping a class.
Always: validate the question, answer directly, explain jargon, give one concrete next step TODAY. Keep under 200 words. Bold key takeaways with **text**. End with "Want me to help with anything else? 🎓"
NEVER say "ask your parents". NEVER judge any question as too basic.`;

const MAIL_AGENT_SYSTEM_PROMPT = `You are an AI email helper for first-generation students.
Write clear, respectful, human emails they can send immediately.
Keep language simple and confident.
Return output in this exact structure:
Subject: <one line>
Body:
<email body with greeting, concise context, clear ask, polite close>
Checklist:
- <3 short bullet points user should do next>
Avoid placeholders like [Your Name]. Use the provided details naturally.`;

const POWER_AGENT_SYSTEM_PROMPT = `You are "Power Agent" for first-generation students.
You are practical, structured, and outcome-focused.
For any task, produce execution-ready output with this format:

## Goal
## Plan (5-7 steps)
## Deliverable
## Actions In Next 24 Hours
## Risks And Fixes

Rules:
- Keep advice realistic and safe.
- When useful, include scripts, message drafts, checklists, or templates.
- Avoid generic filler.
- Be explicit about assumptions.
`;

const POWER_AGENT_REVIEW_PROMPT = `You are a strict reviewer. Improve the draft to make it stronger and more actionable.
Check for gaps, vague steps, missing constraints, and unclear outcomes.
Return the revised final answer only, preserving the same section format.`;

const QUICK_TOPICS = [
  { icon: "💰", label: "FAFSA & Aid", query: "What is FAFSA and how do I fill it out?" },
  { icon: "📧", label: "Email a Prof", query: "How do I email my professor professionally?" },
  { icon: "💼", label: "Internships", query: "How do I find internships with no experience?" },
  { icon: "🏠", label: "Dorm Life", query: "What are the unwritten rules of dorm life?" },
  { icon: "📚", label: "GPA & Classes", query: "How does GPA work and what if I fail a class?" },
  { icon: "🤝", label: "Networking", query: "How do I network without feeling fake?" },
  { icon: "😰", label: "Imposter Syndrome", query: "I feel like I don't belong in college. What do I do?" },
  { icon: "📝", label: "Resume Help", query: "How do I write a resume with no experience?" },
];

const SCHOLARSHIPS = [
  { name: "Central Sector Scholarship (CSSS)", amount: "₹12,000 - ₹20,000 yearly", deadline: "Portal cycle", eligibility: "Income < ₹8 lakh, top 20% in Class 12", gpa: "Merit based", url: "https://scholarships.gov.in" },
  { name: "PM YASASVI Scholarship", amount: "₹75,000 - ₹1.25 lakh", deadline: "Portal cycle", eligibility: "OBC/EBC/DNT students", gpa: "Category + income criteria", url: "https://scholarships.gov.in" },
  { name: "Post-Matric Scholarship (SC/ST/OBC)", amount: "Tuition + stipend", deadline: "Portal cycle", eligibility: "Reserved category with income criteria", gpa: "Category based", url: "https://scholarships.gov.in" },
  { name: "Merit-cum-Means Scholarship (Minority)", amount: "Up to ₹20,000 yearly", deadline: "Portal cycle", eligibility: "Minority communities, income < ₹2.5 lakh", gpa: "Merit + means", url: "https://scholarships.gov.in" },
  { name: "Scholarship for Students with Disabilities", amount: "Tuition + stipend", deadline: "Portal cycle", eligibility: "40% disability", gpa: "Document-based", url: "https://scholarships.gov.in" },
  { name: "Financial Assistance for Wards of Beedi/Cine Workers", amount: "Up to ₹15,000 yearly", deadline: "Portal cycle", eligibility: "Parent must be registered worker", gpa: "Eligibility based", url: "https://scholarships.gov.in" },

  { name: "Delhi Higher & Technical Education Assistance Scheme", amount: "Fee support", deadline: "State cycle", eligibility: "Delhi domicile + merit", gpa: "Merit based", url: "https://edistrict.delhigovt.nic.in" },
  { name: "Mukhyamantri Vidyarthi Pratibha Yojana", amount: "Varies", deadline: "State cycle", eligibility: "Delhi students with good marks", gpa: "Merit based", url: "https://edistrict.delhigovt.nic.in" },
  { name: "Dr. B.R. Ambedkar State Topper Award", amount: "Cash reward", deadline: "State cycle", eligibility: "SC/ST/OBC toppers", gpa: "Topper based", url: "https://edistrict.delhigovt.nic.in" },
  { name: "Post-Matric Scholarship OBC Delhi", amount: "Up to ₹750/month", deadline: "State cycle", eligibility: "OBC students after Class 10", gpa: "Eligibility based", url: "https://edistrict.delhigovt.nic.in" },
  { name: "Tuition Fee Reimbursement Scheme (Delhi)", amount: "Fee reimbursement", deadline: "State cycle", eligibility: "SC/ST/OBC/minority students", gpa: "Income + category", url: "https://edistrict.delhigovt.nic.in" },

  { name: "DU Merit Scholarship", amount: "₹10,000 - ₹50,000", deadline: "College notice", eligibility: "Top marks in college", gpa: "High merit", url: "https://www.du.ac.in" },
  { name: "DU Fee Concession", amount: "Tuition reduction", deadline: "College notice", eligibility: "Low-income students", gpa: "Need based", url: "https://www.du.ac.in" },
  { name: "DU Endowment Scholarships", amount: "Varies", deadline: "College notice", eligibility: "Department-specific eligibility", gpa: "Department merit", url: "https://www.du.ac.in" },

  { name: "SBI Asha Scholarship", amount: "Up to ₹50,000", deadline: "Annual cycle", eligibility: "Family income <= ₹6 lakh", gpa: "Merit + need", url: "https://www.sbifoundation.in" },
  { name: "HDFC Bank Parivartan Scholarship", amount: "₹15,000 - ₹75,000", deadline: "Annual cycle", eligibility: "Merit + financial need", gpa: "Merit based", url: "https://www.hdfcbank.com" },
  { name: "Reliance Foundation Scholarship", amount: "Up to ₹2 lakh", deadline: "Annual cycle", eligibility: "Top students in UG/engineering tracks", gpa: "High merit", url: "https://www.reliancefoundation.org" },
  { name: "Aditya Birla Scholarship", amount: "₹1.8 lakh", deadline: "Annual cycle", eligibility: "Top institutes (IIT/BITS/IIM)", gpa: "Top percentile", url: "https://www.adityabirlascholars.net" },
  { name: "Tata Scholarship", amount: "Varies", deadline: "Annual cycle", eligibility: "Merit + financial need", gpa: "Merit based", url: "https://www.tata.com" },

  { name: "Manav Rachna International Institute of Research and Studies", amount: "25% - 100% fee waiver", deadline: "Admission cycle", eligibility: "Class 12 + MRNAT/JEE/CUET", gpa: "Merit/sports/defence/alumni/Haryana domicile; NAAC A++; mostly partial", url: "https://manavrachna.edu.in" },
  { name: "Manav Rachna University", amount: "25% - 100% tuition waiver", deadline: "Admission cycle", eligibility: "Class 12 + MRNAT/CUET/JEE", gpa: "Merit/sports/girl child; UGC recognized; marks-driven", url: "https://manavrachna.edu.in" },
  { name: "Lingaya's Vidyapeeth", amount: "10% - 50% scholarship", deadline: "Admission cycle", eligibility: "Class 12 marks or entrance exam", gpa: "Merit/Haryana domicile/SC-ST support; UGC approved", url: "https://lingayasvidyapeeth.edu.in" },
  { name: "Echelon Institute of Technology", amount: "Merit scholarship", deadline: "Admission cycle", eligibility: "Class 12 or JEE score", gpa: "Merit/JEE rank; affiliated to Guru Gobind Singh Indraprastha University; limited but genuine", url: "https://eitfaridabad.com" },

  { name: "Sushant University", amount: "10% - 50% scholarship", deadline: "Admission cycle", eligibility: "Class 12 marks / entrance exam", gpa: "Merit/sports; UGC recognized", url: "https://sushantuniversity.edu.in" },
  { name: "GD Goenka University", amount: "Partial fee reduction", deadline: "Admission cycle", eligibility: "Class 12 + university entrance", gpa: "Merit/sports/CUET-based; UGC recognized", url: "https://www.gdgoenkauniversity.com" },
  { name: "KR Mangalam University", amount: "10% - 100% scholarship", deadline: "Admission cycle", eligibility: "Class 12 marks / entrance exam", gpa: "Merit/defence/sports; 100% seats limited", url: "https://www.krmangalam.edu.in" },
  { name: "Amity University Gurugram", amount: "25% - 100% tuition waiver", deadline: "Admission cycle", eligibility: "Class 12 marks / entrance exam", gpa: "Merit/sports/defence; credible and merit-based", url: "https://www.amity.edu/gurgaon" },

  { name: "Amity University Noida", amount: "50% - 100% scholarship", deadline: "Admission cycle", eligibility: "Class 12 + entrance exam/interview", gpa: "100% at 95%+ marks; 50%-75% at 85%-90%; NAAC A+", url: "https://www.amity.edu/noida" },
  { name: "Jaypee Institute of Information Technology", amount: "Merit/JEE rank scholarship", deadline: "Admission cycle", eligibility: "JEE Main or Class 12 route", gpa: "Highly reputed engineering institute", url: "https://www.jiit.ac.in" },
  { name: "Bennett University", amount: "Merit scholarship", deadline: "Admission cycle", eligibility: "Class 12 / JEE / CUET", gpa: "Merit/defence/sibling; reliable but limited", url: "https://www.bennett.edu.in" },

  { name: "Galgotias University", amount: "Up to 100% fee waiver", deadline: "Admission cycle", eligibility: "Class 12 / entrance exam", gpa: "JEE rank support; UGC recognized; marks dependent", url: "https://www.galgotiasuniversity.edu.in" },
  { name: "Sharda University", amount: "Partial to high merit waiver", deadline: "Admission cycle", eligibility: "Class 12 / SUAT exam", gpa: "Merit/CUET/sports; UGC approved; mostly partial", url: "https://www.sharda.ac.in" },

  { name: "KIET Group of Institutions", amount: "Government + merit scholarships", deadline: "Counselling cycle", eligibility: "AKTU counselling", gpa: "Highly reputed AKTU college", url: "https://www.kiet.edu" },
  { name: "Ajay Kumar Garg Engineering College", amount: "Government + merit scholarships", deadline: "Counselling cycle", eligibility: "AKTU counselling via JEE Main", gpa: "Top AKTU engineering college", url: "https://www.akgec.ac.in" },
];

function inferScholarshipCategory(item) {
  const url = (item.url || "").toLowerCase();
  const name = (item.name || "").toLowerCase();

  if (url.includes("scholarships.gov.in")) return "Government";
  if (url.includes("edistrict.delhigovt.nic.in")) return "Delhi Govt";
  if (url.includes("du.ac.in")) return "DU";
  if (
    name.includes("university") ||
    name.includes("institute") ||
    name.includes("college") ||
    name.includes("vidyapeeth") ||
    name.includes("group of institutions") ||
    name.includes("amity") ||
    name.includes("sharda") ||
    name.includes("galgotias") ||
    name.includes("bennett") ||
    name.includes("jaypee") ||
    name.includes("kiet") ||
    name.includes("ajay kumar garg") ||
    name.includes("manav rachna") ||
    name.includes("lingaya") ||
    name.includes("echelon")
  ) {
    return "College-wise";
  }
  return "Private";
}

function getAmountScore(amountText) {
  const t = (amountText || "").toLowerCase();
  const lakhMatch = t.match(/([\d.]+)\s*lakh/);
  if (lakhMatch) return Number(lakhMatch[1]) * 100000;

  const nums = [...t.matchAll(/\d[\d,]*/g)].map(m => Number(m[0].replace(/,/g, "")));
  if (nums.length > 0) return Math.max(...nums);
  if (t.includes("full waiver")) return 1000000;
  if (t.includes("fee reimbursement") || t.includes("fee waiver") || t.includes("tuition")) return 500000;
  return 0;
}

function getDeadlineRank(deadlineText) {
  const t = (deadlineText || "").toLowerCase();
  if (t.includes("portal")) return 1;
  if (t.includes("state")) return 2;
  if (t.includes("college")) return 3;
  if (t.includes("annual")) return 4;
  if (t.includes("admission")) return 5;
  return 99;
}

function inferScholarshipCity(item) {
  const name = (item.name || "").toLowerCase();
  const url = (item.url || "").toLowerCase();

  if (name.includes("manav rachna") || name.includes("lingaya") || name.includes("echelon") || url.includes("eitfaridabad")) return "Faridabad";
  if (name.includes("sushant") || name.includes("goenka") || name.includes("mangalam") || name.includes("gurugram") || name.includes("gurgaon") || url.includes("gurgaon")) return "Gurugram";
  if (name.includes("amity university noida") || name.includes("jaypee") || name.includes("bennett") || (url.includes("noida") && !url.includes("greater-noida"))) return "Noida";
  if (name.includes("galgotias") || name.includes("sharda") || url.includes("galgotias") || url.includes("sharda")) return "Greater Noida";
  if (name.includes("kiet") || name.includes("ajay kumar garg") || url.includes("kiet") || url.includes("akgec")) return "Ghaziabad";
  if (url.includes("du.ac.in")) return "Delhi";

  return "Other";
}

const GLOSSARY = [
  { term: "FAFSA", def: "Free Application for Federal Student Aid — the form you fill out to get financial help from the government for college." },
  { term: "EFC / SAI", def: "Expected Family Contribution / Student Aid Index — what the government thinks your family can afford. Lower = more aid." },
  { term: "GPA", def: "Grade Point Average — a number (0–4.0) representing your average grades. 4.0 = all A's." },
  { term: "Credit Hours", def: "How college measures class time. A typical class = 3 credit hours. You usually need 120 to graduate." },
  { term: "Syllabus", def: "A document your professor gives on day 1 covering all assignments, due dates, grading, and rules. READ IT." },
  { term: "Office Hours", def: "Scheduled times when your professor waits for students to visit. They WANT you to come. It's not an imposition." },
  { term: "Academic Probation", def: "A warning status when your GPA falls too low. You get a chance to bring it up or risk suspension." },
  { term: "Major vs Minor", def: "Major = your main area of study (many classes). Minor = a secondary focus (fewer classes, optional)." },
  { term: "Prerequisite", def: "A class you must take BEFORE another class. Example: Calc 1 before Calc 2." },
  { term: "Work-Study", def: "A federal program that gives you a part-time campus job to help pay for college. Apply via FAFSA." },
  { term: "RA", def: "Resident Advisor — an upperclassman who lives in your dorm and helps with problems and events. They're there to help." },
  { term: "TA", def: "Teaching Assistant — a grad student who helps a professor: runs sections, grades papers, holds office hours." },
  { term: "Registrar", def: "The office that handles all official academic records: transcripts, enrollment verification, graduation audits." },
  { term: "Financial Aid Award Letter", def: "A letter from your school showing your aid: grants (free money), loans (pay back), and work-study." },
  { term: "Imposter Syndrome", def: "Feeling like you don't belong or you'll be 'found out' as a fraud. Extremely common for first-gen students. You DO belong." },
  { term: "Elective", def: "A class you choose freely, not required for your major. Good for exploring interests or boosting GPA." },
  { term: "Drop vs Withdraw", def: "Drop = remove a class early (no record). Withdraw = remove a class late (W on transcript, no GPA penalty)." },
  { term: "Transcript", def: "Your official academic record showing every class taken and grade earned. Schools and employers request this." },
  { term: "STEM", def: "Science, Technology, Engineering, and Math — a category of majors often with more job opportunities and higher salaries." },
  { term: "Liberal Arts", def: "A broad education covering writing, history, philosophy, arts, sciences. Teaches critical thinking — not just 'art'." },
];

const EMAILS = [
  {
    title: "Introducing yourself to a professor",
    tag: "Academic",
    subject: "Introduction — [Your Name], [Course Name]",
    body: `Hi Professor [Last Name],

My name is [Your Name] and I'm enrolled in your [Course Name] class on [Days/Time]. I wanted to introduce myself and let you know I'm looking forward to the course.

I'm a [Year, e.g., first-year] student majoring in [Major]. If you have any advice for succeeding in this class, I'd love to hear it.

Thank you for your time!

[Your Name]`,
  },
  {
    title: "Asking a question about an assignment",
    tag: "Academic",
    subject: "[Course Name] — Question About [Assignment Name]",
    body: `Hi Professor [Last Name],

I hope you're doing well. I'm [Your Name] from your [Course Name] class ([Days/Time]).

I had a question about [Assignment Name]. Specifically, I wasn't sure about [your specific question here]. I've already re-read the syllabus, but I'm still unclear.

Would you be able to clarify? I'm happy to come to office hours if that's easier.

Thank you so much!

[Your Name]`,
  },
  {
    title: "Requesting an extension",
    tag: "Academic",
    subject: "[Course Name] — Extension Request for [Assignment]",
    body: `Hi Professor [Last Name],

I'm [Your Name] from your [Course Name] class. I'm writing to ask if an extension would be possible for [Assignment Name], currently due [date].

I've been dealing with [brief, honest reason — illness, family emergency, etc.] and I want to make sure I submit quality work. I would need until [proposed new date].

I understand if this isn't possible and I take full responsibility. Please let me know either way.

Thank you for your understanding.

[Your Name]`,
  },
  {
    title: "Asking for a recommendation letter",
    tag: "Career",
    subject: "Recommendation Letter Request — [Your Name]",
    body: `Hi Professor [Last Name],

I hope you're doing well. My name is [Your Name] and I was in your [Course Name] class in [Semester/Year].

I'm applying to [program/job/scholarship] and I was hoping you might be willing to write a recommendation letter for me. I thought of you because [specific reason].

The deadline is [date] and I'm happy to provide my resume or personal statement.

Please let me know if you're able to do this. I completely understand if you're too busy.

Thank you so much!

[Your Name]`,
  },
  {
    title: "Following up after a career fair",
    tag: "Career",
    subject: "Great Meeting You at [Career Fair Name] — [Your Name]",
    body: `Hi [Recruiter's Name],

It was great meeting you at [Career Fair Name]! I really enjoyed learning about [Company Name] and the [specific role] you mentioned.

I'm very interested in the position and have since applied online. I'd love to stay in touch.

I've attached my resume for your reference. Please don't hesitate to reach out!

[Your Name]
[Phone] | [LinkedIn URL]`,
  },
  {
    title: "Cold email to a professional for advice",
    tag: "Career",
    subject: "Quick Question from a First-Gen College Student",
    body: `Hi [Name],

My name is [Your Name] and I'm a [year] student at [University] studying [Major]. I found your profile on LinkedIn and I admire your work in [their field].

I'm a first-generation college student trying to navigate a career in [field], and I'd love any advice — even 15 minutes over a call would mean the world.

Questions I have:
- [Question 1]
- [Question 2]

I completely understand if you're too busy. Thank you for considering it!

[Your Name]`,
  },
];

const LINKS = [
  { name: "FAFSA", desc: "Official FAFSA application portal (Federal Student Aid)", url: "https://studentaid.gov/fafsa-app/", icon: "📝", tag: "Financial Aid" },
  { name: "Handshake", desc: "Find internships & jobs for college students", url: "https://joinhandshake.com", icon: "🤝", tag: "Career" },
  { name: "Khan Academy", desc: "Free tutoring for any subject", url: "https://khanacademy.org", icon: "📖", tag: "Academic" },
  { name: "Scholarships.com", desc: "Search thousands of scholarships", url: "https://scholarships.com", icon: "🏆", tag: "Financial Aid" },
  { name: "LinkedIn", desc: "Build your professional profile", url: "https://linkedin.com", icon: "💼", tag: "Career" },
  { name: "Chegg", desc: "Textbook rentals & study help", url: "https://chegg.com", icon: "📚", tag: "Academic" },
  { name: "Crisis Text Line", desc: "Text HOME to 741741 for free support", url: "https://crisistextline.org", icon: "💙", tag: "Wellbeing" },
  { name: "Student Aid Estimator", desc: "Estimate your financial aid package", url: "https://studentaid.gov/aid-estimator/", icon: "🧮", tag: "Financial Aid" },
  { name: "Grammarly", desc: "Check your writing & emails for free", url: "https://grammarly.com", icon: "✍️", tag: "Academic" },
  { name: "Indeed", desc: "Find part-time jobs near campus", url: "https://indeed.com", icon: "🔍", tag: "Career" },
  { name: "Calendly", desc: "Schedule office hours easily", url: "https://calendly.com", icon: "📅", tag: "Academic" },
  { name: "Mint", desc: "Free budgeting app for students", url: "https://mint.intuit.com", icon: "💳", tag: "Financial Aid" },
];

const TAG_COLORS = { "Financial Aid": "#14b8a6", "Career": "#10b981", "Academic": "#6366f1", "Wellbeing": "#ec4899" };

const CHAIN_PLACEMENT_DATA = [
  { college: "XYZ University", placementRate: "91%", avgPackage: "Rs 7.8 LPA", updated: "12 March 2026", hash: "0x8a72f3bc19d4a7" },
  { college: "ABC Institute", placementRate: "84%", avgPackage: "Rs 6.1 LPA", updated: "11 March 2026", hash: "0x7c11de9af4b220" },
];

const CHAIN_STUDENT_REVIEWS = [
  { college: "XYZ University", course: "BTech", wallet: "0x3b2a...19ef", rating: 4.4, note: "Strong coding culture and active placement support." },
  { college: "North Campus College", course: "BCom", wallet: "0x91ab...62dc", rating: 4.1, note: "Faculty support is good, internship cell can improve." },
];

const CHAIN_ADMISSION_VERIFICATION = [
  { offerId: "7h8sd92", college: "ABC Institute", student: "FG-2026-114", status: "Verified" },
  { offerId: "3k2qd55", college: "City Tech University", student: "FG-2026-287", status: "Pending" },
];

const CHAIN_SCHOLARSHIP_TRACKING = [
  { scholarship: "Merit Support Grant", amount: "Rs 50,000", stage: "Amount Released", txId: "0xa1fd...9930" },
  { scholarship: "STEM Women Scholarship", amount: "Rs 35,000", stage: "Application Approved", txId: "0xcd21...11be" },
];

const CHAIN_CERTIFICATE_LOCKER = [
  { doc: "10th Mark Sheet", issuer: "State Board", hash: "0x54aa3...bd2f" },
  { doc: "12th Mark Sheet", issuer: "CBSE", hash: "0x22cf9...72ae" },
  { doc: "Entrance Result", issuer: "JEE", hash: "0x1c88f...6d01" },
  { doc: "Admission Letter", issuer: "XYZ University", hash: "0x9ed0b...3af4" },
];

const CHAIN_DECENTRALIZED_RANKING = [
  { college: "XYZ University", score: 8.8, placement: 9.1, feedback: 8.5, infra: 8.6 },
  { college: "ABC Institute", score: 8.2, placement: 8.3, feedback: 8.0, infra: 8.4 },
  { college: "North Campus College", score: 7.9, placement: 7.7, feedback: 8.2, infra: 7.8 },
];

const CHAIN_TRUST_SCORE = [
  { college: "XYZ University", score: 8.6, checks: ["Verified Placement Records", "Verified Student Reviews", "NAAC Accreditation"] },
  { college: "ABC Institute", score: 8.1, checks: ["Verified Admission Offers", "Scholarship Ledger", "Accreditation Proof"] },
];

const CHAIN_SMART_CONTRACT_ADMISSIONS = [
  { contractId: "SC-2026-113", college: "XYZ University", seat: "Allocated", payment: "Confirmed", refund: "Rule Locked" },
  { contractId: "SC-2026-221", college: "ABC Institute", seat: "Allocated", payment: "Pending", refund: "Rule Locked" },
];

const VERIFIED_ADMISSION_LETTERS = [
  { student: "FG-2026-312", college: "ABC University", date: "12 May 2026", status: "Verified", hash: "0x7bf2...9ea1" },
  { student: "FG-2026-443", college: "Unknown Campus", date: "09 May 2026", status: "Not Found", hash: "0x0000...0000" },
];

const VERIFIED_AGENTS = [
  { name: "XYZ Education Services", status: "Verified", complaints: 0, fraudReports: 0, trust: 8.9 },
  { name: "Global Admit Hub", status: "Watchlist", complaints: 6, fraudReports: 2, trust: 4.2 },
];

const VERIFIED_PAYMENT_CHANNELS = [
  { college: "ABC University", bank: "SBI", accountStatus: "Verified", upi: "university@sbi" },
  { college: "City Tech Institute", bank: "HDFC", accountStatus: "Verified", upi: "admissions@hdfcbank" },
];

const PLACEMENT_CLAIM_AUDITS = [
  { college: "Future Skills University", claim: 100, estimate: 65, signal: "Possible exaggeration detected" },
  { college: "ABC University", claim: 86, estimate: 82, signal: "Claim appears realistic" },
];

const FRAUD_REPORTS = [
  { issue: "Fake placement promise", target: "Agent network", status: "Under Investigation", evidence: "Offer letter + payment proof" },
  { issue: "Fake hostel fee demand", target: "Unofficial broker", status: "Community Warning Active", evidence: "UPI screenshot" },
];

const VERIFIED_PROFESSORS = [
  { name: "Dr. Rahul Sharma", phd: "Verified", publications: 12, experience: "10 years", affiliation: "ABC University" },
  { name: "Dr. Neha Mehta", phd: "Verified", publications: 18, experience: "9 years", affiliation: "XYZ University" },
];

const VERIFIED_INTERNSHIPS = [
  { company: "Infosys", role: "Software Development Intern", stipend: "Rs 25,000/month", status: "Verified" },
  { company: "TCS", role: "Data Analyst Intern", stipend: "Rs 20,000/month", status: "Verified" },
];

const PROFESSOR_HELP_SYSTEM = [
  { topic: "AI Career Path", professor: "Dr. Mehta", date: "25 March 2026", type: "Mentor Session" },
  { topic: "Research Writing Bootcamp", professor: "Dr. Sharma", date: "29 March 2026", type: "Research Opportunity" },
];

const ACADEMIC_RISK_WARNINGS = [
  { course: "BTech Mechanical", mathNeed: "High", studentMath: "Low", recommendation: "Consider BCA or IT programs" },
  { course: "BSc Statistics", mathNeed: "High", studentMath: "Medium", recommendation: "Take bridge Math module before semester" },
];

const STUDENT_DIGITAL_IDENTITY = [
  { id: "SID-26-1019", records: "Academic records + entrance scores + certificates", scholarshipReady: "Yes" },
  { id: "SID-26-1844", records: "Academic records + verified admission + certificates", scholarshipReady: "Yes" },
];

const TRANSPARENT_FEE_BREAKDOWN = [
  { college: "ABC University", tuition: "Rs 1,20,000", hostel: "Rs 80,000", exam: "Rs 5,000", hidden: "None" },
  { college: "XYZ University", tuition: "Rs 1,45,000", hostel: "Rs 75,000", exam: "Rs 6,500", hidden: "None" },
];

const INFRA_REALITY_CHECK = [
  { college: "ABC University", status: "Verified by Students", source: "Campus GPS + geotagged photos" },
  { college: "North Campus College", status: "Partially Verified", source: "Pending more GPS uploads" },
];

const TRUSTCHAIN_FEATURES = [
  { id: "student-feedback", label: "Student Feedback", help: "Read real student feedback linked to each college before making decisions." },
  { id: "credit-score", label: "College Credit Score", help: "See a credibility score built from trust, reviews, and verification signals." },
  { id: "admission-checker", label: "Admission Checker", help: "Upload or compare letter hash before paying any admission fee." },
  { id: "agent-verification", label: "Agent Verification", help: "Verify consultant trust score, complaints, and fraud history first." },
  { id: "fee-safety", label: "Fee Safety", help: "Only transfer money to verified college bank and UPI channels." },
  { id: "placement-detector", label: "Placement Audit", help: "Cross-check placement claims against independent estimates." },
  { id: "fraud-reports", label: "Fraud Reports", help: "Submit evidence quickly to protect other students from scams." },
  { id: "professor-verification", label: "Professor Verification", help: "Validate faculty credentials, papers, and teaching background." },
  { id: "internships", label: "Verified Internships", help: "Use only verified companies and role listings to avoid fake postings." },
  { id: "professor-help", label: "Professor Help", help: "Professors can publish guidance, mentorship sessions, and research calls." },
  { id: "academic-risk", label: "Academic Risk", help: "Get an early warning when course difficulty mismatches current marks." },
  { id: "digital-identity", label: "Digital Identity", help: "Keep verified records ready for faster scholarships and admissions." },
  { id: "fee-breakdown", label: "Fee Breakdown", help: "Review all costs upfront and detect hidden charges before enrollment." },
  { id: "infra-check", label: "Infrastructure Check", help: "Validate campus reality using geotagged student uploads." },
];

const TRUSTCHAIN_KEYWORDS = {
  "admission-checker": ["admission", "letter", "hash", "document", "verification"],
  "agent-verification": ["agent", "consultant", "fraud", "trust score", "complaint"],
  "fee-safety": ["fee", "payment", "bank", "upi", "account", "verified"],
  "placement-detector": ["placement", "claim", "detector", "audit", "linkedin"],
  "fraud-reports": ["complaint", "fraud", "report", "evidence", "warning"],
  "professor-verification": ["professor", "faculty", "publication", "phd", "experience"],
  "internships": ["internship", "company", "verified", "stipend", "job"],
  "professor-help": ["mentor", "professor", "guidance", "research", "session"],
  "academic-risk": ["risk", "course", "math", "warning", "recommendation"],
  "digital-identity": ["digital", "identity", "records", "certificate", "scholarship"],
  "fee-breakdown": ["fee", "breakdown", "tuition", "hostel", "hidden charges"],
  "infra-check": ["infrastructure", "campus", "photos", "geotag", "gps"],
};

const TRUST_VERDICT_STORAGE_KEY = "firstgen.trustVerdicts.v1";
const WALLET_STUDENT_SESSION_KEY = "firstgen.walletStudentId.v1";
const WALLET_CATEGORIES = ["All", "Document", "Fee Receipt", "Certificate", "ID Proof", "Other"];

const VERDICT_OPTIONS = [
  { id: "good", label: "Good", tone: "good", note: "Looks safe and verified." },
  { id: "bad", label: "Bad", tone: "bad", note: "Potential risk detected, review carefully." },
  { id: "review", label: "Needs Review", tone: "review", note: "Needs manual verification before final decision." },
  { id: "report", label: "Report", tone: "report", note: "Flag and report this case to support/fraud portal." },
  { id: "pending", label: "Pending", tone: "pending", note: "Keep pending until documents or proof arrive." },
];

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:8787" : "")).replace(/\/$/, "");
const CONFIG_STATUS_PATH = import.meta.env.VITE_CONFIG_STATUS_PATH || "/api/config-status";
const MESSAGES_PATH = import.meta.env.VITE_MESSAGES_PATH || "/api/v1/messages";
const N8N_CHAT_PATH = import.meta.env.VITE_N8N_CHAT_PATH || "/api/n8n/chat";
const OLLAMA_CHAT_PATH = import.meta.env.VITE_OLLAMA_CHAT_PATH || "/api/ollama/chat";
const OLLAMA_STATUS_PATH = import.meta.env.VITE_OLLAMA_STATUS_PATH || "/api/ollama/status";
const TRUSTCHAIN_PAYMENTS_PATH = import.meta.env.VITE_TRUSTCHAIN_PAYMENTS_PATH || "/api/trustchain/payments";
const WALLET_ITEMS_PATH = import.meta.env.VITE_WALLET_ITEMS_PATH || "/api/wallet/items";

function buildApiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
}

function buildLocalReply(question) {
  const q = question.toLowerCase();

  if (q.includes("fafsa") || q.includes("financial aid") || q.includes("tuition") || q.includes("loan")) {
    return "**Start with FAFSA first.** It is the main form that unlocks grants, loans, and work-study. Fill it out at studentaid.gov using your tax info and school list. If something asks for terms you do not know, that is normal. **Today’s next step:** create your StudentAid.gov account, then gather your ID and tax documents before starting.";
  }

  if (q.includes("professor") || q.includes("email") || q.includes("office hours") || q.includes("assignment")) {
    return "**Keep professor emails short and respectful.** Say who you are, what class you are in, and your exact question in 2 to 4 sentences. Office hours are time your professor sets aside to help students, so going is a good move, not a bother. **Today’s next step:** draft your message with a clear subject line and one specific question before sending it.";
  }

  if (q.includes("internship") || q.includes("resume") || q.includes("job") || q.includes("career")) {
    return "**You do not need perfect experience to start.** Put class projects, campus involvement, volunteer work, and part-time jobs on your resume because they still show skills. Apply early and keep your resume simple and specific. **Today’s next step:** pick one internship site like Handshake or LinkedIn and apply to 3 roles that match your interests.";
  }

  if (q.includes("gpa") || q.includes("fail") || q.includes("class") || q.includes("credit")) {
    return "**One class does not define your future.** GPA is your average grade score, and credit hours are how schools count classes toward graduation. If you are struggling, talk to your professor and advisor before deadlines for dropping or withdrawing. **Today’s next step:** check your syllabus and calculate where your grade stands right now.";
  }

  if (q.includes("network") || q.includes("linkedin")) {
    return "**Networking is just building real relationships.** You do not need to sound fake. Ask people about their path, what they wish they knew in college, and how they got started. **Today’s next step:** message one alum, recruiter, or professional with a short note asking one thoughtful question.";
  }

  if (q.includes("imposter") || q.includes("belong") || q.includes("anxious") || q.includes("stress") || q.includes("mental health")) {
    return "**You belong here.** Feeling behind or out of place is very common for first-gen students, even when they are doing well. Getting support is a strength, not a weakness. **Today’s next step:** reach out to one support person today, like counseling, an advisor, an RA, or a trusted professor.";
  }

  const glossaryMatch = GLOSSARY.find((item) => q.includes(item.term.toLowerCase()));
  if (glossaryMatch) {
    return `**${glossaryMatch.term}** means: ${glossaryMatch.def} **Today’s next step:** write that term down and check how it applies to your school’s current process.`;
  }

  const cleanQuestion = question.trim().replace(/\s+/g, " ");
  const shortQuestion = cleanQuestion.length > 95 ? `${cleanQuestion.slice(0, 95)}...` : cleanQuestion;
  return `**Good question:** "${shortQuestion}". College has a lot of hidden rules, and learning them takes time. I can break this into clear steps and help you act today. **Today’s next step:** tell me your goal (example: admissions, PCB career path, exam prep, scholarships, or college choice), and I will give you a concrete 3-step plan.`;
}

export default function App() {
  const [tab, setTab] = useState("chat");
  const [sidebar, setSidebar] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [glossQ, setGlossQ] = useState("");
  const [copied, setCopied] = useState(null);
  const [linkFilter, setLinkFilter] = useState("All");
  const [scholarshipFilter, setScholarshipFilter] = useState("All");
  const [scholarshipQ, setScholarshipQ] = useState("");
  const [scholarshipCity, setScholarshipCity] = useState("All Cities");
  const [scholarshipSort, setScholarshipSort] = useState("recommended");
  const [trustFeature, setTrustFeature] = useState("all");
  const [trustQ, setTrustQ] = useState("");
  const [studentRatings, setStudentRatings] = useState(() => CHAIN_STUDENT_REVIEWS.map((r) => ({ ...r })));
  const [ratingForm, setRatingForm] = useState({ college: "", course: "", wallet: "", rating: "4", note: "" });
  const [ratingError, setRatingError] = useState("");
  const [revealedAdmissionIndex, setRevealedAdmissionIndex] = useState(null);
  const [trustVerdicts, setTrustVerdicts] = useState({});
  const [trustPayments, setTrustPayments] = useState([]);
  const [paymentForm, setPaymentForm] = useState({});
  const [paymentBusyKey, setPaymentBusyKey] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [paymentCollegeFilter, setPaymentCollegeFilter] = useState("All");
  const [paymentEditId, setPaymentEditId] = useState("");
  const [paymentEditForm, setPaymentEditForm] = useState({ studentId: "", amount: "", transactionRef: "", note: "" });
  const [paymentAdminBusyId, setPaymentAdminBusyId] = useState("");
  const [paymentAdminMessage, setPaymentAdminMessage] = useState("");
  const [walletItems, setWalletItems] = useState([]);
  const [walletFilter, setWalletFilter] = useState("All");
  const [walletStudentId, setWalletStudentId] = useState("");
  const [walletStudentDraftId, setWalletStudentDraftId] = useState("");
  const [walletDraft, setWalletDraft] = useState({ title: "", category: "Document", note: "", fileName: "", fileType: "", fileSize: 0 });
  const [walletFile, setWalletFile] = useState(null);
  const [walletBusy, setWalletBusy] = useState(false);
  const [walletMessage, setWalletMessage] = useState("");
  const [openEmail, setOpenEmail] = useState(null);
  const [mailGoal, setMailGoal] = useState("Professor question");
  const [mailRecipient, setMailRecipient] = useState("");
  const [mailTone, setMailTone] = useState("Warm + Professional");
  const [mailContext, setMailContext] = useState("");
  const [mailDraft, setMailDraft] = useState(null);
  const [mailBusy, setMailBusy] = useState(false);
  const [mailError, setMailError] = useState("");
  const [mailCopied, setMailCopied] = useState(false);
  const [agentTask, setAgentTask] = useState("");
  const [agentMode, setAgentMode] = useState("General");
  const [agentConstraints, setAgentConstraints] = useState("");
  const [agentResult, setAgentResult] = useState("");
  const [agentBusy, setAgentBusy] = useState(false);
  const [agentError, setAgentError] = useState("");
  const [agentCopied, setAgentCopied] = useState(false);
  const [apiConfigured, setApiConfigured] = useState(null);
  const [ollamaReachable, setOllamaReachable] = useState(false);
  const [ollamaAvailable, setOllamaAvailable] = useState(null);
  const [ollamaModel, setOllamaModel] = useState("llama3.1");
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window === "undefined" ? 1280 : window.innerWidth));
  const [accentTheme, setAccentTheme] = useState("indigo");
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const walletFileRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    updateViewportWidth();
    window.addEventListener("resize", updateViewportWidth);
    return () => window.removeEventListener("resize", updateViewportWidth);
  }, []);

  useEffect(() => {
    let active = true;

    const checkStatus = async () => {
      try {
        const r = await fetch(buildApiUrl(CONFIG_STATUS_PATH));
        const data = await r.json();
        if (active) setApiConfigured(Boolean(data.configured));
      } catch {
        if (active) setApiConfigured(null);
      }
      try {
        const r = await fetch(buildApiUrl(OLLAMA_STATUS_PATH));
        const data = await r.json();
        if (active) {
          setOllamaReachable(Boolean(data.reachable));
          setOllamaAvailable(Boolean(data.available));
          if (data.models?.length > 0) {
            const preferred = data.models.includes(data.defaultModel)
              ? data.defaultModel
              : data.models.find(m => m.includes("8b") || m.includes("llama3") || m.includes("llama"));
            if (preferred) {
              setOllamaModel(preferred);
            }
          }
        }
      } catch {
        if (active) {
          setOllamaReachable(false);
          setOllamaAvailable(false);
        }
      }
    };

    checkStatus();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(TRUST_VERDICT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        setTrustVerdicts(parsed);
      }
    } catch {
      // Ignore corrupt local storage and continue with clean state.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(TRUST_VERDICT_STORAGE_KEY, JSON.stringify(trustVerdicts));
    } catch {
      // Ignore write errors (private mode/quota) without breaking UI.
    }
  }, [trustVerdicts]);

  useEffect(() => {
    let active = true;
    const loadPayments = async () => {
      try {
        const r = await fetch(buildApiUrl(TRUSTCHAIN_PAYMENTS_PATH));
        const data = await r.json().catch(() => ({ items: [] }));
        if (active) {
          setTrustPayments(Array.isArray(data.items) ? data.items : []);
        }
      } catch {
        if (active) {
          setTrustPayments([]);
        }
      }
    };
    loadPayments();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(WALLET_STUDENT_SESSION_KEY) || "";
      const saved = raw.trim();
      if (saved) {
        setWalletStudentId(saved);
        setWalletStudentDraftId(saved);
      }
    } catch {
      // Ignore storage read errors.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (!walletStudentId) {
        window.localStorage.removeItem(WALLET_STUDENT_SESSION_KEY);
      } else {
        window.localStorage.setItem(WALLET_STUDENT_SESSION_KEY, walletStudentId);
      }
    } catch {
      // Ignore storage write errors.
    }
  }, [walletStudentId]);

  useEffect(() => {
    let active = true;
    const loadWallet = async () => {
      if (!walletStudentId) {
        if (active) {
          setWalletItems([]);
        }
        return;
      }
      try {
        const r = await fetch(buildApiUrl(`${WALLET_ITEMS_PATH}?studentId=${encodeURIComponent(walletStudentId)}`));
        const data = await r.json().catch(() => ({ items: [] }));
        if (active) {
          setWalletItems(Array.isArray(data.items) ? data.items : []);
        }
      } catch {
        if (active) {
          setWalletItems([]);
          setWalletMessage("Wallet server is not reachable right now.");
        }
      }
    };
    loadWallet();
    return () => { active = false; };
  }, [walletStudentId]);

  const onWalletFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setWalletMessage("File is too large. Keep files under 4MB.");
      return;
    }

    setWalletFile(file);
    setWalletDraft((prev) => ({
      ...prev,
      title: prev.title || file.name,
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
      fileSize: file.size,
    }));
    setWalletMessage("");
  };

  const addWalletItem = async () => {
    const title = walletDraft.title.trim();
    const note = walletDraft.note.trim();
    if (!walletStudentId) {
      setWalletMessage("Enter Student ID to access your wallet.");
      return;
    }
    if (!title || !walletFile) {
      setWalletMessage("Add a title and choose a file first.");
      return;
    }

    setWalletBusy(true);
    setWalletMessage("");
    try {
      const fd = new FormData();
      fd.append("studentId", walletStudentId);
      fd.append("title", title);
      fd.append("category", walletDraft.category || "Document");
      fd.append("note", note);
      fd.append("file", walletFile);

      const r = await fetch(buildApiUrl(WALLET_ITEMS_PATH), {
        method: "POST",
        body: fd,
      });
      if (!r.ok) {
        throw new Error("Upload failed");
      }

      const data = await r.json().catch(() => ({}));
      if (data.item) {
        setWalletItems((prev) => [data.item, ...prev]);
      }
      setWalletDraft({ title: "", category: "Document", note: "", fileName: "", fileType: "", fileSize: 0 });
      setWalletFile(null);
      if (walletFileRef.current) {
        walletFileRef.current.value = "";
      }
      setWalletMessage("Saved to wallet server.");
    } catch {
      setWalletMessage("Could not save this file right now.");
    } finally {
      setWalletBusy(false);
    }
  };

  const deleteWalletItem = async (id) => {
    if (!walletStudentId) {
      setWalletMessage("Enter Student ID to access your wallet.");
      return;
    }
    try {
      const r = await fetch(buildApiUrl(`${WALLET_ITEMS_PATH}/${encodeURIComponent(id)}?studentId=${encodeURIComponent(walletStudentId)}`), {
        method: "DELETE",
      });
      if (!r.ok) {
        throw new Error("Delete failed");
      }
      setWalletItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      setWalletMessage("Could not delete file right now.");
    }
  };

  const formatFileSize = (size) => {
    if (!size) return "0 KB";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const loginWalletStudent = () => {
    const nextId = walletStudentDraftId.trim().toUpperCase();
    if (!nextId) {
      setWalletMessage("Please enter your Student ID.");
      return;
    }
    setWalletStudentId(nextId);
    setWalletMessage("");
  };

  const logoutWalletStudent = () => {
    setWalletStudentId("");
    setWalletStudentDraftId("");
    setWalletItems([]);
    setWalletMessage("Wallet session cleared.");
  };

  const isPhone = viewportWidth < 640;
  const isTablet = viewportWidth < 960;
  const secondary = accentTheme === "rose"
    ? { hex: "#fb7185", light: "#fecdd3", rgb: "251,113,133", deepRgb: "244,63,94" }
    : { hex: "#818cf8", light: "#c7d2fe", rgb: "129,140,248", deepRgb: "99,102,241" };

  const send = async (text) => {
    const t = text || input.trim();
    if (!t || loading) return;
    setStarted(true); setTab("chat"); setInput(""); setSidebar(false);
    const next = [...msgs, { role: "user", content: t }];
    setMsgs(next);
    setLoading(true);

    // ── n8n chat agent (primary external agent) ─────────────────────────────
    try {
      const n8nResponse = await fetch(buildApiUrl(N8N_CHAT_PATH), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: SYSTEM_PROMPT, messages: next, sessionId: "firstgen-guide-chat" }),
      });

      if (n8nResponse.ok) {
        const data = await n8nResponse.json().catch(() => ({}));
        const reply = data.message?.content || data.output || data.response || "";
        if (reply) {
          setMsgs([...next, { role: "assistant", content: reply }]);
          setLoading(false);
          setTimeout(() => inputRef.current?.focus(), 100);
          return;
        }
      }
      const err = await n8nResponse.json().catch(() => ({}));
      const detail = err.detail || err.error || "n8n chat webhook failed.";
      const extra = err.rawDetail ? `\n\nDebug: ${err.rawDetail}` : "";
      setMsgs([
        ...next,
        {
          role: "assistant",
          content: `⚠️ **Chat agent is unavailable right now.**\n\nThe n8n workflow is not active yet or the webhook URL is wrong.\n\n💡 ${detail}${extra}`,
        },
      ]);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "n8n chat webhook failed.";
      setMsgs([
        ...next,
        {
          role: "assistant",
          content: `⚠️ **Chat agent is unavailable right now.**\n\nThe n8n webhook could not be reached.\n\n💡 ${detail}`,
        },
      ]);
    }

    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const copyEmail = (i, body) => { navigator.clipboard.writeText(body); setCopied(i); setTimeout(() => setCopied(null), 2000); };

  const parseMailDraft = (rawText) => {
    const text = (rawText || "").trim();
    const subjectMatch = text.match(/subject\s*:\s*(.+)/i);
    const bodyMatch = text.match(/body\s*:\s*([\s\S]*?)(?:\n\s*checklist\s*:|$)/i);
    const checklistMatch = text.match(/checklist\s*:\s*([\s\S]*)$/i);

    const subject = (subjectMatch?.[1] || "Request for support").trim();
    const body = (bodyMatch?.[1] || text).trim();
    const checklist = (checklistMatch?.[1] || "")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /^[-*•]/.test(line))
      .map((line) => line.replace(/^[-*•]\s*/, ""))
      .slice(0, 3);

    return {
      subject,
      body,
      checklist: checklist.length ? checklist : ["Review and personalize the message.", "Attach any required files.", "Send and set a follow-up reminder."],
    };
  };

  const generateMailDraft = async () => {
    const context = mailContext.trim();
    if (!context) {
      setMailError("Please describe your situation so the agent can draft your email.");
      return;
    }

    if (!ollamaAvailable) {
      setMailError("Ollama is not ready. Start Ollama so the Mail Agent can generate drafts.");
      return;
    }

    setMailBusy(true);
    setMailError("");
    setMailDraft(null);

    const userPrompt = `Goal: ${mailGoal}\nRecipient: ${mailRecipient || "Not specified"}\nTone: ${mailTone}\nSituation:\n${context}`;

    try {
      const r = await fetch(buildApiUrl(OLLAMA_CHAT_PATH), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ollamaModel,
          system: MAIL_AGENT_SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      if (!r.ok) {
        throw new Error("Mail Agent request failed");
      }

      const ct = r.headers.get("content-type") || "";
      let generated = "";

      if (ct.includes("text/event-stream")) {
        const reader = r.body.getReader();
        const decoder = new TextDecoder();
        outer: while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true }).split("\n");
          for (const line of chunk) {
            if (!line.startsWith("data: ")) continue;
            try {
              const json = JSON.parse(line.slice(6));
              if (json.delta) generated += json.delta;
              if (json.done) break outer;
            } catch {
              // Ignore malformed SSE lines.
            }
          }
        }
      } else {
        const d = await r.json().catch(() => ({}));
        generated = d.message?.content || "";
      }

      if (!generated.trim()) {
        throw new Error("No draft returned");
      }

      setMailDraft(parseMailDraft(generated));
    } catch {
      setMailError("Could not generate email right now. Please try again in a few seconds.");
    } finally {
      setMailBusy(false);
    }
  };

  const copyMailDraft = async () => {
    if (!mailDraft) return;
    const text = `Subject: ${mailDraft.subject}\n\n${mailDraft.body}`;
    await navigator.clipboard.writeText(text);
    setMailCopied(true);
    setTimeout(() => setMailCopied(false), 2000);
  };

  const openMailApp = () => {
    if (!mailDraft) return;
    const subject = encodeURIComponent(mailDraft.subject);
    const body = encodeURIComponent(mailDraft.body);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
  };

  const requestOllamaText = async (system, userContent) => {
    const r = await fetch(buildApiUrl(OLLAMA_CHAT_PATH), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ollamaModel,
        system,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!r.ok) throw new Error("Ollama request failed");

    const ct = r.headers.get("content-type") || "";
    let out = "";

    if (ct.includes("text/event-stream")) {
      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(line.slice(6));
            if (json.delta) out += json.delta;
            if (json.done) break outer;
          } catch {
            // Ignore malformed lines.
          }
        }
      }
      return out.trim();
    }

    const d = await r.json().catch(() => ({}));
    return (d.message?.content || "").trim();
  };

  const runPowerAgent = async () => {
    const task = agentTask.trim();
    if (!task) {
      setAgentError("Describe the work you want the agent to do.");
      return;
    }
    if (!ollamaAvailable) {
      setAgentError("Ollama is not ready. Start Ollama so Power Agent can run.");
      return;
    }

    setAgentBusy(true);
    setAgentError("");
    setAgentResult("");

    const constraints = agentConstraints.trim() || "None";
    const plannerPrompt = `Mode: ${agentMode}\nTask: ${task}\nConstraints: ${constraints}\nOutput must be concrete and executable.`;

    try {
      const firstPass = await requestOllamaText(POWER_AGENT_SYSTEM_PROMPT, plannerPrompt);
      if (!firstPass) throw new Error("No result from planner");

      const reviewInput = `Original task:\n${plannerPrompt}\n\nDraft answer:\n${firstPass}`;
      const improved = await requestOllamaText(POWER_AGENT_REVIEW_PROMPT, reviewInput);
      setAgentResult(improved || firstPass);
    } catch {
      setAgentError("Power Agent could not complete this request right now. Try again.");
    } finally {
      setAgentBusy(false);
    }
  };

  const copyAgentResult = async () => {
    if (!agentResult) return;
    await navigator.clipboard.writeText(agentResult);
    setAgentCopied(true);
    setTimeout(() => setAgentCopied(false), 2000);
  };

  const fmt = (text) => text.split("\n").map((line, i) => {
    const html = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    if (line.startsWith("- ") || line.startsWith("• ")) return <li key={i} dangerouslySetInnerHTML={{ __html: html.slice(2) }} style={{ marginBottom: 4 }} />;
    if (!line.trim()) return <br key={i} />;
    return <p key={i} style={{ margin: "3px 0" }} dangerouslySetInnerHTML={{ __html: html }} />;
  });

  const filtGloss = GLOSSARY.filter(g => g.term.toLowerCase().includes(glossQ.toLowerCase()) || g.def.toLowerCase().includes(glossQ.toLowerCase()));
  const filteredWalletItems = walletFilter === "All"
    ? walletItems
    : walletItems.filter((item) => item.category === walletFilter);
  const linkTags = ["All", ...new Set(LINKS.map(l => l.tag))];
  const filtLinks = linkFilter === "All" ? LINKS : LINKS.filter(l => l.tag === linkFilter);
  const scholarshipTags = ["All", "Government", "Delhi Govt", "DU", "Private", "College-wise"];
  const scholarshipCities = ["All Cities", "Faridabad", "Gurugram", "Noida", "Greater Noida", "Ghaziabad", "Delhi", "Other"];
  const scholarshipsWithCategory = SCHOLARSHIPS.map(s => ({ ...s, category: inferScholarshipCategory(s), city: inferScholarshipCity(s) }));
  const filtScholarships = scholarshipFilter === "All"
    ? scholarshipsWithCategory
    : scholarshipsWithCategory.filter(s => s.category === scholarshipFilter);
  const cityFilteredScholarships = scholarshipCity === "All Cities"
    ? filtScholarships
    : filtScholarships.filter(s => s.city === scholarshipCity);
  const searchQ = scholarshipQ.trim().toLowerCase();
  const visibleScholarships = searchQ
    ? cityFilteredScholarships.filter(s => {
      const hay = `${s.name} ${s.eligibility} ${s.gpa} ${s.deadline} ${s.amount} ${s.category} ${s.city}`.toLowerCase();
      return hay.includes(searchQ);
    })
    : cityFilteredScholarships;
  const sortedScholarships = [...visibleScholarships].sort((a, b) => {
    if (scholarshipSort === "amount_desc") return getAmountScore(b.amount) - getAmountScore(a.amount);
    if (scholarshipSort === "name_asc") return a.name.localeCompare(b.name);
    if (scholarshipSort === "deadline_soon") return getDeadlineRank(a.deadline) - getDeadlineRank(b.deadline);
    return getDeadlineRank(a.deadline) - getDeadlineRank(b.deadline);
  });
  const scholarshipFiltersActive = scholarshipFilter !== "All" || scholarshipCity !== "All Cities" || searchQ.length > 0 || scholarshipSort !== "recommended";

  const trustQNormalized = trustQ.trim().toLowerCase();
  const collegeSearchActive = trustQNormalized.length > 0;
  const selectedTrustFeature = TRUSTCHAIN_FEATURES.find((f) => f.id === trustFeature) || null;
  const isTrustFeatureVisible = (featureId) => trustFeature === "all" || trustFeature === featureId;
  const matchesCollegeQuery = (...parts) => {
    if (!trustQNormalized) return true;
    return parts.join(" ").toLowerCase().includes(trustQNormalized);
  };

  const filteredAdmissionLetters = VERIFIED_ADMISSION_LETTERS.filter((item) => matchesCollegeQuery(item.college, item.student));
  const filteredPaymentChannels = VERIFIED_PAYMENT_CHANNELS.filter((item) => matchesCollegeQuery(item.college));
  const filteredPlacementAudits = PLACEMENT_CLAIM_AUDITS.filter((item) => matchesCollegeQuery(item.college));
  const filteredStudentFeedback = studentRatings.filter((item) => matchesCollegeQuery(item.college));
  const trustScoreRows = Object.entries(studentRatings.reduce((acc, item) => {
    if (!acc[item.college]) acc[item.college] = { total: 0, count: 0 };
    acc[item.college].total += Number(item.rating) || 0;
    acc[item.college].count += 1;
    return acc;
  }, {})).map(([college, data]) => {
    const avgRating = data.total / data.count;
    const trustScore = Math.min(10, Number((avgRating * 2).toFixed(1)));
    return { college, avgRating: Number(avgRating.toFixed(1)), trustScore, count: data.count };
  }).sort((a, b) => b.trustScore - a.trustScore);
  const filteredTrustScores = trustScoreRows.filter((item) => matchesCollegeQuery(item.college));
  const filteredCreditScores = filteredTrustScores.map((item, index) => {
    const creditScore = Math.min(900, Math.round(item.trustScore * 90));
    const band = creditScore >= 780 ? "Excellent" : creditScore >= 690 ? "Strong" : creditScore >= 600 ? "Moderate" : "Risk";
    return { ...item, rank: index + 1, creditScore, band };
  });
  const filteredFeeBreakdown = TRANSPARENT_FEE_BREAKDOWN.filter((item) => matchesCollegeQuery(item.college));
  const filteredInfraCheck = INFRA_REALITY_CHECK.filter((item) => matchesCollegeQuery(item.college));

  const visibleTrustFeatureCount = TRUSTCHAIN_FEATURES.filter((f) => isTrustFeatureVisible(f.id)).length;
  const verdictCounts = VERDICT_OPTIONS.reduce((acc, option) => {
    acc[option.id] = 0;
    return acc;
  }, {});
  Object.values(trustVerdicts).forEach((value) => {
    if (!value || !verdictCounts[value]) return;
    verdictCounts[value] += 1;
  });
  const verdictTotal = Object.values(verdictCounts).reduce((sum, n) => sum + n, 0);

  const getVerdictKey = (moduleId, itemKey) => `${moduleId}:${itemKey}`;
  const getVerdict = (moduleId, itemKey) => trustVerdicts[getVerdictKey(moduleId, itemKey)] || null;
  const setVerdict = (moduleId, itemKey, verdict) => {
    const key = getVerdictKey(moduleId, itemKey);
    setTrustVerdicts((prev) => ({
      ...prev,
      [key]: prev[key] === verdict ? null : verdict,
    }));
  };

  const renderVerdictControls = (moduleId, itemKey) => {
    const verdict = getVerdict(moduleId, itemKey);
    const activeVerdict = VERDICT_OPTIONS.find((v) => v.id === verdict) || null;
    return (
      <div className="verdict-wrap">
        <p className="verdict-title">Tap result:</p>
        <div className="verdict-actions">
          {VERDICT_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`verdict-btn ${option.tone} ${verdict === option.id ? "active" : ""}`}
              onClick={() => setVerdict(moduleId, itemKey, option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
        {activeVerdict && (
          <p className={`verdict-note ${activeVerdict.tone}`}>
            {activeVerdict.note}
          </p>
        )}
      </div>
    );
  };

  const getPaymentFormKey = (item) => `${item.college}|${item.bank}|${item.upi}`;

  const getPaymentForm = (item) => {
    const key = getPaymentFormKey(item);
    return paymentForm[key] || { studentId: "", amount: "", transactionRef: "" };
  };

  const setPaymentField = (item, field, value) => {
    const key = getPaymentFormKey(item);
    setPaymentForm((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || { studentId: "", amount: "", transactionRef: "" }),
        [field]: value,
      },
    }));
  };

  const submitPaymentRecord = async (item) => {
    const key = getPaymentFormKey(item);
    const form = getPaymentForm(item);
    const studentId = form.studentId.trim();
    const amount = Number(form.amount);
    const transactionRef = form.transactionRef.trim();

    if (!studentId || !Number.isFinite(amount) || amount <= 0) {
      setPaymentError("Enter a valid Student ID and payment amount.");
      return;
    }

    setPaymentBusyKey(key);
    setPaymentError("");

    try {
      const r = await fetch(buildApiUrl(TRUSTCHAIN_PAYMENTS_PATH), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          college: item.college,
          bank: item.bank,
          upi: item.upi,
          studentId,
          amount,
          transactionRef,
        }),
      });

      if (!r.ok) {
        throw new Error("Could not save payment.");
      }

      const data = await r.json().catch(() => ({}));
      if (data.item) {
        setTrustPayments((prev) => [data.item, ...prev]);
      }

      setPaymentForm((prev) => ({
        ...prev,
        [key]: { studentId: "", amount: "", transactionRef: "" },
      }));
    } catch {
      setPaymentError("Payment record could not be saved right now.");
    } finally {
      setPaymentBusyKey("");
    }
  };

  const paymentCollegeOptions = [
    "All",
    ...Array.from(new Set(trustPayments.map((item) => (item.college || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
  ];

  const filteredPaymentRecords = paymentCollegeFilter === "All"
    ? trustPayments
    : trustPayments.filter((item) => item.college === paymentCollegeFilter);

  const startEditPayment = (entry) => {
    setPaymentEditId(entry.id);
    setPaymentAdminMessage("");
    setPaymentEditForm({
      studentId: entry.studentId || "",
      amount: String(entry.amount || ""),
      transactionRef: entry.transactionRef || "",
      note: entry.note || "",
    });
  };

  const cancelEditPayment = () => {
    setPaymentEditId("");
    setPaymentEditForm({ studentId: "", amount: "", transactionRef: "", note: "" });
  };

  const saveEditedPayment = async (entryId) => {
    const studentId = paymentEditForm.studentId.trim();
    const amount = Number(paymentEditForm.amount);
    const transactionRef = paymentEditForm.transactionRef.trim();
    const note = paymentEditForm.note.trim();

    if (!studentId || !Number.isFinite(amount) || amount <= 0) {
      setPaymentAdminMessage("Enter valid Student ID and amount before saving.");
      return;
    }

    setPaymentAdminBusyId(`edit:${entryId}`);
    setPaymentAdminMessage("");

    try {
      const r = await fetch(buildApiUrl(`${TRUSTCHAIN_PAYMENTS_PATH}/${encodeURIComponent(entryId)}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, amount, transactionRef, note }),
      });
      if (!r.ok) {
        throw new Error("Failed to update payment record.");
      }
      const data = await r.json().catch(() => ({}));
      if (data.item) {
        setTrustPayments((prev) => prev.map((p) => (p.id === entryId ? data.item : p)));
      }
      cancelEditPayment();
      setPaymentAdminMessage("Payment record updated.");
    } catch {
      setPaymentAdminMessage("Could not update this record right now.");
    } finally {
      setPaymentAdminBusyId("");
    }
  };

  const deletePaymentRecord = async (entryId) => {
    if (!window.confirm("Delete this payment record?")) return;
    setPaymentAdminBusyId(`delete:${entryId}`);
    setPaymentAdminMessage("");

    try {
      const r = await fetch(buildApiUrl(`${TRUSTCHAIN_PAYMENTS_PATH}/${encodeURIComponent(entryId)}`), {
        method: "DELETE",
      });
      if (!r.ok) {
        throw new Error("Failed to delete payment record.");
      }
      setTrustPayments((prev) => prev.filter((p) => p.id !== entryId));
      if (paymentEditId === entryId) {
        cancelEditPayment();
      }
      setPaymentAdminMessage("Payment record deleted.");
    } catch {
      setPaymentAdminMessage("Could not delete this record right now.");
    } finally {
      setPaymentAdminBusyId("");
    }
  };

  const exportPaymentsCsv = () => {
    const rows = filteredPaymentRecords;
    if (!rows.length) {
      setPaymentAdminMessage("No payment rows to export for this filter.");
      return;
    }

    const csvEscape = (value) => {
      const text = value == null ? "" : String(value);
      if (text.includes(",") || text.includes("\n") || text.includes('"')) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };

    const header = ["id", "college", "bank", "upi", "studentId", "amount", "transactionRef", "note", "status", "createdAt", "updatedAt"];
    const lines = [header.join(",")];
    rows.forEach((row) => {
      const values = header.map((key) => csvEscape(row[key] ?? ""));
      lines.push(values.join(","));
    });

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    const filterPart = paymentCollegeFilter === "All" ? "all" : paymentCollegeFilter.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    link.href = url;
    link.download = `trustchain-payments-${filterPart}-${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setPaymentAdminMessage("CSV exported.");
  };

  const submitStudentRating = (e) => {
    e.preventDefault();
    const college = ratingForm.college.trim();
    const course = ratingForm.course.trim();
    const wallet = ratingForm.wallet.trim();
    const note = ratingForm.note.trim();
    const rating = Number(ratingForm.rating);

    if (!college || !course || !wallet || !note) {
      setRatingError("Please fill all fields before uploading rating.");
      return;
    }
    if (Number.isNaN(rating) || rating < 1 || rating > 5) {
      setRatingError("Rating must be between 1 and 5.");
      return;
    }

    setStudentRatings((prev) => [{ college, course, wallet, rating, note }, ...prev]);
    setRatingForm({ college: "", course: "", wallet: "", rating: "4", note: "" });
    setRatingError("");
  };

  const TABS = [
    { id: "chat", icon: "💬", label: "Ask Guide" },
    { id: "scholarships", icon: "🏆", label: "Scholarships" },
    { id: "trustchain", icon: "⛓️", label: "TrustChain" },
    { id: "wallet", icon: "🗂️", label: "Wallet" },
    { id: "glossary", icon: "📖", label: "Glossary" },
    { id: "emails", icon: "📧", label: "Email Templates" },
    { id: "links", icon: "🔗", label: "Resources" },
  ];

  const C = {
    root: { minHeight: "100dvh", background: "linear-gradient(160deg,#05050f 0%,#0a0f1f 45%,#12131f 100%)", fontFamily: "'Outfit','Inter',system-ui,sans-serif", display: "flex", flexDirection: "column", overflow: "hidden" },
    bg: { position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: `radial-gradient(ellipse at 14% 8%, rgba(${secondary.rgb},.14) 0%,transparent 52%), radial-gradient(ellipse at 88% 78%, rgba(20,184,166,.1) 0%,transparent 50%), radial-gradient(ellipse at 50% 110%, rgba(${secondary.deepRgb},.1) 0%,transparent 45%), radial-gradient(ellipse at 60% 22%, rgba(20,184,166,.06) 0%,transparent 40%)` },
    hdr: { padding: isPhone ? "14px 14px 11px" : "20px 24px 14px", zIndex: 10, borderBottom: `1px solid rgba(${secondary.rgb},.2)`, position: "sticky", top: 0, backdropFilter: "blur(32px) saturate(1.6)", WebkitBackdropFilter: "blur(32px) saturate(1.6)", background: `linear-gradient(180deg,rgba(${secondary.rgb},.14) 0%,rgba(6,6,16,.92) 100%)`, boxShadow: "0 1px 0 rgba(20,184,166,.12), 0 8px 32px rgba(0,0,0,.4)" },
    logoRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 10 },
    logoCluster: { display: "flex", alignItems: "center", gap: isPhone ? 12 : 16, padding: isPhone ? "10px 12px" : "14px 18px", borderRadius: isPhone ? 16 : 20, background: `linear-gradient(120deg,rgba(${secondary.rgb},.18),rgba(20,184,166,.12) 42%,rgba(255,255,255,.04) 100%)`, border: `1px solid rgba(${secondary.rgb},.26)`, boxShadow: `0 10px 34px rgba(${secondary.deepRgb},.14), inset 0 1px 0 rgba(255,255,255,.18)` },
    logoBox: { width: isPhone ? 54 : 66, height: isPhone ? 54 : 66, borderRadius: isPhone ? 18 : 22, background: `linear-gradient(140deg,#14b8a6 0%,${secondary.hex} 55%,#0ea5a4 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isPhone ? 25 : 31, boxShadow: `0 14px 32px rgba(20,184,166,.38), 0 0 0 1px rgba(${secondary.rgb},.35), inset 0 1px 0 rgba(255,255,255,.34)`, animation: "logoPulse 3s ease-in-out infinite", flexShrink: 0 },
    logoName: { margin: 0, fontSize: isPhone ? 38 : 52, lineHeight: 1, fontWeight: 900, color: "#f5f5f8", letterSpacing: "-1.2px", fontFamily: "'Outfit',sans-serif", textShadow: "0 4px 16px rgba(0,0,0,.35)" },
    logoSub: { margin: isPhone ? "6px 0 0" : "8px 0 0", fontSize: isPhone ? 10 : 13, color: "#7d86ab", textTransform: "uppercase", letterSpacing: isPhone ? "2px" : "4px", fontWeight: 600 },
    tabBar: { display: "flex", overflowX: "auto", scrollbarWidth: "none", gap: 8, padding: isPhone ? "7px 6px" : "9px 7px", borderRadius: 16, background: "linear-gradient(180deg,rgba(7,11,30,.58),rgba(6,10,24,.28))", border: "1px solid rgba(255,255,255,.08)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.08), inset 0 -1px 0 rgba(0,0,0,.3), 0 10px 26px rgba(0,0,0,.28)", perspective: "1000px" },
    tab: (a) => ({ padding: isPhone ? "8px 12px" : "9px 18px", border: "1px solid", borderColor: a ? `rgba(${secondary.rgb},.55)` : "rgba(255,255,255,.08)", background: a ? `linear-gradient(140deg,rgba(${secondary.rgb},.24),rgba(20,184,166,.16) 58%,rgba(255,255,255,.06))` : "linear-gradient(140deg,rgba(255,255,255,.08),rgba(255,255,255,.02) 58%,rgba(0,0,0,.12))", color: a ? secondary.light : "#8e97be", borderRadius: 12, cursor: "pointer", fontSize: isPhone ? 11 : 12.5, fontWeight: a ? 700 : 500, letterSpacing: a ? "-.2px" : 0, fontFamily: "'Outfit','Inter',system-ui,sans-serif", whiteSpace: "nowrap", transition: "all .28s", display: "flex", alignItems: "center", gap: 5, textShadow: a ? `0 0 20px rgba(${secondary.rgb},.5)` : "0 1px 0 rgba(0,0,0,.25)", boxShadow: a ? `0 10px 24px rgba(${secondary.deepRgb},.26), inset 0 1px 0 rgba(255,255,255,.24)` : "0 5px 14px rgba(0,0,0,.24), inset 0 1px 0 rgba(255,255,255,.14)", transform: a ? "translateY(-2px) rotateX(7deg)" : "translateY(0) rotateX(0deg)", transformStyle: "preserve-3d" }),
    main: { flex: 1, display: "flex", overflow: "hidden", position: "relative", zIndex: 1, width: "min(1240px, 100%)", margin: "0 auto" },
    scroll: { flex: 1, overflowY: "auto", padding: isPhone ? "18px 14px 18px" : "22px 26px 16px" },
  };

  return (
    <div
      style={{
        ...C.root,
        "--secondary-hex": secondary.hex,
        "--secondary-light": secondary.light,
        "--secondary-rgb": secondary.rgb,
        "--secondary-deep-rgb": secondary.deepRgb,
      }}
    >
      <div style={C.bg} />
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0.62 }}>
      <DottedSurface style={{ opacity: 0.32 }} />
        <GridScan
          linesColor="#1a1535"
          scanColor="#14b8a6"
          scanOpacity={0.16}
          gridScale={0.12}
          lineThickness={1}
          lineJitter={0.08}
          scanDirection="pingpong"
          scanDuration={2.5}
          scanDelay={1.5}
          scanGlow={0.32}
          scanSoftness={2}
          scanPhaseTaper={0.85}
          noiseIntensity={0.003}
          bloomIntensity={0.03}
          bloomThreshold={0.1}
          bloomSmoothing={0.3}
          chromaticAberration={0.001}
          enablePost={true}
          style={{ width: "100%", height: "100%", opacity: 0.6 }}
        />
      </div>
      {/* floating orbs */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* SIDEBAR */}
      {sidebar && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <div onClick={() => setSidebar(false)} style={{ flex: 1, background: "rgba(0,0,0,.65)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }} />
          <div className="sidebar-panel" style={{
            width: isPhone ? "calc(100vw - 20px)" : 300, maxWidth: 330,
            background: "linear-gradient(180deg,rgba(12,10,28,.98) 0%,rgba(8,8,20,.99) 100%)",
            borderLeft: "1px solid rgba(20,184,166,.18)",
            boxShadow: "-20px 0 80px rgba(0,0,0,.6), -1px 0 0 rgba(20,184,166,.1)",
            overflowY: "auto", padding: "22px 18px", animation: "slideIn .28s cubic-bezier(.22,.68,0,1.2)"
          }}>
            {/* Sidebar Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 26 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#14b8a6,#2dd4bf)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, boxShadow: "0 4px 16px rgba(20,184,166,.45)" }}>🎓</div>
                <span style={{ color: "#f5f5f8", fontSize: 15, fontWeight: 800, letterSpacing: "-.3px", fontFamily: "'Outfit',sans-serif" }}>Quick <span style={{ color: "#14b8a6" }}>Access</span></span>
              </div>
              <button className="fx-btn" onClick={() => setSidebar(false)}
                style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", color: "#6a6a88", fontSize: 14, cursor: "pointer", borderRadius: 9, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "linear-gradient(90deg,rgba(20,184,166,.3),rgba(var(--secondary-deep-rgb),.2),transparent)", marginBottom: 20 }} />

            {/* Quick Topics */}
            <p className="sidebar-label">⚡ Quick Topics</p>
            {QUICK_TOPICS.map(t => (
              <button className="sidebar-btn" key={t.label} onClick={() => send(t.query)}
                style={{ width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 11, padding: "10px 14px", marginBottom: 5, cursor: "pointer", color: "#9090b0", fontSize: 12.5, textAlign: "left", display: "flex", alignItems: "center", gap: 10, transition: "all .18s", fontFamily: "'Outfit',sans-serif", fontWeight: 500 }}
                onMouseEnter={e => { e.currentTarget.style.background="rgba(20,184,166,.1)"; e.currentTarget.style.color="#5eead4"; e.currentTarget.style.borderColor="rgba(20,184,166,.3)"; e.currentTarget.style.transform="translateX(4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,.04)"; e.currentTarget.style.color="#9090b0"; e.currentTarget.style.borderColor="rgba(255,255,255,.07)"; e.currentTarget.style.transform="translateX(0)"; }}
              ><span style={{ fontSize: 17 }}>{t.icon}</span><span>{t.label}</span></button>
            ))}

            {/* Divider */}
            <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(var(--secondary-deep-rgb),.25),transparent)", margin: "18px 0" }} />

            {/* Key Links */}
            <p className="sidebar-label">🔗 Key Links</p>
            {LINKS.slice(0, 6).map(l => (
              <a key={l.name} href={l.url} target="_blank" rel="noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 13px", marginBottom: 4, background: "rgba(255,255,255,.03)", borderRadius: 10, textDecoration: "none", color: "#6a6a88", fontSize: 12.5, transition: "all .18s", border: "1px solid transparent", fontFamily: "'Outfit',sans-serif" }}
                onMouseEnter={e => { e.currentTarget.style.color="#c8c8e0"; e.currentTarget.style.background="rgba(255,255,255,.07)"; e.currentTarget.style.borderColor="rgba(255,255,255,.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.color="#6a6a88"; e.currentTarget.style.background="rgba(255,255,255,.03)"; e.currentTarget.style.borderColor="transparent"; }}
              ><span style={{ fontSize: 16 }}>{l.icon}</span><span>{l.name}</span></a>
            ))}

            {/* Divider */}
            <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(16,185,129,.2),transparent)", margin: "18px 0" }} />

            {/* Browse Sections */}
            <p className="sidebar-label">📚 Browse Sections</p>
            {TABS.slice(1).map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setSidebar(false); }}
                style={{ width: "100%", background: "none", border: "1px solid transparent", padding: "9px 13px", marginBottom: 3, cursor: "pointer", color: "#6a6a88", fontSize: 12.5, textAlign: "left", borderRadius: 11, display: "flex", gap: 10, alignItems: "center", transition: "all .18s", fontFamily: "'Outfit',sans-serif", fontWeight: 500 }}
                onMouseEnter={e => { e.currentTarget.style.background="rgba(var(--secondary-deep-rgb),.1)"; e.currentTarget.style.color="#a5b4fc"; e.currentTarget.style.borderColor="rgba(var(--secondary-deep-rgb),.2)"; e.currentTarget.style.transform="translateX(4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background="none"; e.currentTarget.style.color="#6a6a88"; e.currentTarget.style.borderColor="transparent"; e.currentTarget.style.transform="translateX(0)"; }}
              ><span style={{ fontSize: 17 }}>{t.icon}</span><span>{t.label}</span></button>
            ))}

            {/* Footer glow line */}
            <div style={{ height: 1, background: "linear-gradient(90deg,rgba(20,184,166,.2),rgba(var(--secondary-deep-rgb),.15),transparent)", margin: "22px 0 8px" }} />
            <p style={{ margin: 0, fontSize: 10, color: "#38384a", textAlign: "center", letterSpacing: ".5px" }}>FirstGen Guide ✨ Your college older sibling</p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header style={C.hdr}>
        <div style={C.logoRow}>
          <div className="brand-shell" style={C.logoCluster}>
            <div style={C.logoBox}>🎓</div>
            <div>
              <h1 className="brand-title" style={C.logoName}>First<span className="brand-gen">Gen</span> Guide</h1>
              <p style={C.logoSub}>YOUR COLLEGE OLDER SIBLING ✨</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              className="fx-btn"
              onClick={() => setAccentTheme((prev) => (prev === "rose" ? "indigo" : "rose"))}
              style={{
                background: `linear-gradient(135deg,rgba(${secondary.rgb},.2),rgba(20,184,166,.1))`,
                border: `1px solid rgba(${secondary.rgb},.35)`,
                borderRadius: 10,
                padding: isPhone ? "7px 10px" : "8px 12px",
                color: secondary.light,
                fontSize: 11,
                cursor: "pointer",
                fontFamily: "'Outfit',sans-serif",
                fontWeight: 700,
                letterSpacing: "-.1px",
                boxShadow: `0 2px 10px rgba(${secondary.deepRgb},.2)`,
                whiteSpace: "nowrap",
              }}
              title="Toggle accent palette"
            >
              {accentTheme === "rose" ? "Teal + Rose" : "Teal + Indigo"}
            </button>
            <button className="fx-btn" onClick={() => setSidebar(true)}
              style={{ background: "linear-gradient(135deg,rgba(20,184,166,.18),rgba(20,184,166,.06))", border: "1px solid rgba(20,184,166,.3)", borderRadius: 10, padding: isPhone ? "7px 12px" : "8px 16px", color: "#5eead4", fontSize: isPhone ? 12 : 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 6, fontWeight: 600, boxShadow: "0 2px 12px rgba(20,184,166,.15)" }}
              onMouseEnter={e => { e.currentTarget.style.background="linear-gradient(135deg,rgba(20,184,166,.28),rgba(20,184,166,.12))"; e.currentTarget.style.boxShadow="0 4px 20px rgba(20,184,166,.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.background="linear-gradient(135deg,rgba(20,184,166,.18),rgba(20,184,166,.06))"; e.currentTarget.style.boxShadow="0 2px 12px rgba(20,184,166,.15)"; }}
            >{isPhone ? "☰" : "☰ Quick Access"}</button>
          </div>
        </div>
        <div className="nav-3d-bar" style={C.tabBar}>
          {TABS.map(t => <button className={`tab-btn fx-btn ${tab === t.id ? "active" : ""}`} key={t.id} style={C.tab(tab === t.id)} onClick={() => setTab(t.id)}>{t.icon} {t.label}</button>)}
        </div>
        <div className="trust-strip" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          <span className="trust-pill">Built for first-gen students</span>
          <span className="trust-pill">Practical step-by-step help</span>
          <span className="trust-pill">No judgment, no jargon</span>
        </div>
      </header>

      <div style={C.main}>

        {/* CHAT */}
        {tab === "chat" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ ...C.scroll, maxHeight: isPhone ? "calc(100dvh - 185px)" : "calc(100dvh - 195px)" }}>
              {!started ? (
                <div>
                  <div className="hero-panel" style={{ borderRadius: 18, padding: isPhone ? "18px 16px" : "20px 24px", marginBottom: 14 }}>
                    <p style={{ margin: "0 0 8px", color: "#c9fbf3", fontSize: 11, textTransform: "uppercase", letterSpacing: "1.2px", fontWeight: 700 }}>College clarity, without the confusion</p>
                    <h2 style={{ margin: "0 0 9px", color: "#fff7ec", fontSize: isPhone ? 22 : 28, lineHeight: 1.18, letterSpacing: "-.6px", fontFamily: "'Outfit',sans-serif", fontWeight: 800 }}>Your first-generation college command center.</h2>
                    <p style={{ margin: "0 0 12px", color: "#9fe6dc", fontSize: 12.5, lineHeight: 1.7, maxWidth: 760 }}>Ask one question, get a direct answer, and leave with one concrete action you can take today.</p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span className="hero-stat">FAFSA + aid decoded</span>
                      <span className="hero-stat">Email scripts ready</span>
                      <span className="hero-stat">Career steps that work</span>
                      <span className="hero-stat">Zero judgment zone</span>
                    </div>
                  </div>
                  <div className="glass-card" style={{ borderColor:"rgba(var(--secondary-deep-rgb),.25)", borderRadius: 16, padding: isPhone ? "14px 16px" : "16px 20px", marginBottom: 18, display: "flex", alignItems: "center", gap: 14, boxShadow:"0 4px 24px rgba(var(--secondary-deep-rgb),.12)" }}>
                    <span style={{ fontSize: 26 }}>🤖</span>
                    <div>
                      <p style={{ margin: "0 0 4px", color: "var(--secondary-light)", fontSize: 13, fontWeight: 700, fontFamily:"'Outfit',sans-serif" }}>n8n chat agent connected</p>
                      <p style={{ margin: 0, color: "#8898e0", fontSize: 11, lineHeight: 1.6 }}>Ask Guide now uses your external n8n chat workflow for answers.</p>
                    </div>
                  </div>
                  <div className="quote-card" style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 14, lineHeight: 1.85, color: "#9898b8", margin: "0 0 10px", fontStyle: "italic", fontFamily:"'Outfit',sans-serif" }}>"Nobody told me what FAFSA was. Nobody explained office hours. I figured it all out the hard way."</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#48486a", letterSpacing: ".2px" }}>— Every first-gen student, ever.</p>
                  </div>
                  <p style={{ color: "#6a6a8a", fontSize: 14, marginBottom: 16, lineHeight: 1.7, fontFamily:"'Outfit',sans-serif" }}>Hi! I'm your FirstGen Guide 👋 Ask me <em>anything</em> about college — no question is too basic.</p>
                  <p style={{ color: "#48486a", fontSize: 9, marginBottom: 18, textTransform: "uppercase", letterSpacing: "1.6px", fontWeight: 600, textAlign: "center" }}>Tap a topic to start →</p>
                  <div className="perspective-layer" style={{ display: "grid", gridTemplateColumns: "1fr", gap: isPhone ? 10 : 14, maxWidth: isPhone ? "100%" : 760, margin: "0 auto 10px" }}>
                    {QUICK_TOPICS.map((t, i) => (
                      <button key={t.label} onClick={() => send(t.query)} className="topic-card topic-entry"
                        style={{ background: "rgba(255,255,255,.045)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, padding: isPhone ? "14px 14px" : "17px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, color: "#8888a0", textAlign:"left", width: "100%", animationDelay: `${80 + i * 55}ms` }}
                        onMouseEnter={e => { e.currentTarget.style.background="rgba(20,184,166,.1)"; e.currentTarget.style.borderColor="rgba(20,184,166,.35)"; e.currentTarget.style.color="#5eead4"; }}
                        onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,.045)"; e.currentTarget.style.borderColor="rgba(255,255,255,.1)"; e.currentTarget.style.color="#8888a0"; }}
                      ><div style={{ width:36, height:36, borderRadius:10, background:"rgba(20,184,166,.12)", border:"1px solid rgba(20,184,166,.18)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{t.icon}</div><span style={{ fontSize:12, fontWeight:600, fontFamily:"'Outfit',sans-serif" }}>{t.label}</span></button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                  {msgs.map((m, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-start", gap: 9 }}>
                      {m.role === "assistant" && <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#14b8a6,#2dd4bf)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0, marginTop: 2 }}>🎓</div>}
                      <div style={{ maxWidth: isPhone ? "88%" : "78%", background: m.role === "user" ? "linear-gradient(135deg,#14b8a6,var(--secondary-hex))" : "rgba(255,255,255,.055)", border: m.role === "user" ? "none" : "1px solid rgba(255,255,255,.09)", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "4px 16px 16px 16px", padding: "12px 15px", color: m.role === "user" ? "#fff" : "#c8c8d8", fontSize: 13, lineHeight: 1.7, wordBreak: "break-word", boxShadow: m.role === "user" ? "0 4px 18px rgba(var(--secondary-deep-rgb),.3)" : "0 2px 12px rgba(0,0,0,.25)" }}>
                        {m.role === "assistant" ? (
                        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                          {fmt(m.content)}
                          {m.streaming && <span className="typing-cursor">▍</span>}
                        </ul>
                      ) : m.content}
                      </div>
                      {m.role === "user" && <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0, marginTop: 2 }}>🙋</div>}
                    </div>
                  ))}
                  {loading && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#14b8a6,#2dd4bf)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>🎓</div>
                      <div style={{ background: "rgba(255,255,255,.055)", border: "1px solid rgba(255,255,255,.09)", borderRadius: "4px 16px 16px 16px", padding: "12px 16px", display: "flex", gap: 5, alignItems: "center" }}>
                        {[0,1,2].map(j => <div key={j} style={{ width: 7, height: 7, borderRadius: "50%", background: "#14b8a6", animation: "bounce 1.2s ease-in-out infinite", animationDelay: `${j*.18}s` }} />)}
                      </div>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>
              )}
            </div>
            {started && (
              <div style={{ display: "flex", gap: 5, overflowX: "auto", padding: isPhone ? "0 12px 7px" : "0 18px 7px", scrollbarWidth: "none" }}>
                {QUICK_TOPICS.map(t => (
                <button className="fx-btn" key={t.label} onClick={() => send(t.query)} style={{ flexShrink: 0, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 20, padding: "4px 12px", cursor: "pointer", color: "#48485a", fontSize: 10, whiteSpace: "nowrap", transition: "all .15s" }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#5eead4"; e.currentTarget.style.borderColor = "rgba(20,184,166,.3)"; e.currentTarget.style.background = "rgba(20,184,166,.07)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "#48485a"; e.currentTarget.style.borderColor = "rgba(255,255,255,.08)"; e.currentTarget.style.background = "rgba(255,255,255,.04)"; }}
                  >{t.icon} {t.label}</button>
                ))}
              </div>
            )}
            <div style={{ padding: isPhone ? "3px 12px 2px" : "3px 18px 2px", display: "flex", alignItems: "center" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 20, padding: "3px 12px" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", display: "inline-block", flexShrink: 0, boxShadow: "0 0 6px rgba(var(--secondary-deep-rgb),.45)" }} />
                <span style={{ fontSize: 10, color: "#6f79d8", whiteSpace: "nowrap" }}>
                  🤖 n8n webhook chat
                </span>
              </div>
            </div>
            <div style={{ padding: isPhone ? "0 12px 12px" : "0 18px 14px" }}>
              <div className="input-shell" style={{ display: "flex", gap: 10, alignItems: "flex-end", background: "linear-gradient(120deg,rgba(10,14,34,.96),rgba(var(--secondary-deep-rgb),.2),rgba(20,184,166,.2))", border: "1px solid rgba(var(--secondary-rgb),.5)", borderRadius: 999, padding: isPhone ? "8px 8px 8px 14px" : "10px 10px 10px 18px", transition: "box-shadow .25s, border-color .25s, transform .25s" }}>
                <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="Ask anything about college... 💬" rows={1}
                  style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#f4f7ff", fontSize: 13, fontFamily: "'Inter', system-ui, sans-serif", resize: "none", lineHeight: 1.5, maxHeight: 90, overflowY: "auto" }}
                  onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 90) + "px"; }}
                />
                <button className="send-btn fx-btn" onClick={() => send()} disabled={!input.trim() || loading}
                  style={{ width: 38, height: 38, borderRadius: 999, border: "1px solid rgba(255,255,255,.22)", background: input.trim() && !loading ? "linear-gradient(135deg,#14b8a6,var(--secondary-hex))" : "rgba(255,255,255,.08)", cursor: input.trim() && !loading ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, transition: "all .2s", boxShadow: input.trim() && !loading ? "0 0 24px rgba(20,184,166,.35)" : "none" }}>➤</button>
              </div>
            </div>
          </div>
        )}

        {/* SCHOLARSHIPS */}
        {tab === "scholarships" && (
          <div style={{...C.scroll, animation: "fadeIn .35s ease"}}>
            <h2 className="section-accent" style={{ color: "#f1f1f6", fontSize: 19, margin: "0 0 18px", fontWeight: 700, letterSpacing: "-.3px" }}>🏆 Scholarship Database <span style={{ fontSize: 11, fontWeight: 500, color: "#5a5a6e", letterSpacing: 0 }}>— curated for first-gen students</span></h2>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {scholarshipTags.map((tag) => {
                const active = scholarshipFilter === tag;
                return (
                  <button
                    key={tag}
                    className="fx-btn"
                    onClick={() => setScholarshipFilter(tag)}
                    style={{
                      background: active ? "linear-gradient(135deg,rgba(20,184,166,.2),rgba(20,184,166,.1))" : "rgba(255,255,255,.04)",
                      color: active ? "#5eead4" : "#7a7a8a",
                      border: active ? "1px solid rgba(20,184,166,.4)" : "1px solid rgba(255,255,255,.08)",
                      borderRadius: 999,
                      padding: "6px 14px",
                      fontSize: 11,
                      fontWeight: active ? 600 : 400,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      letterSpacing: active ? "-.1px" : 0,
                      boxShadow: active ? "0 2px 10px rgba(20,184,166,.18)" : "none",
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            {scholarshipFilter === "College-wise" && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                {scholarshipCities.map((city) => {
                  const active = scholarshipCity === city;
                  return (
                    <button
                      key={city}
                      className="fx-btn"
                      onClick={() => setScholarshipCity(city)}
                      style={{
                        background: active ? "linear-gradient(135deg,rgba(16,185,129,.18),rgba(16,185,129,.08))" : "rgba(255,255,255,.04)",
                        color: active ? "#34d399" : "#7a7a8a",
                        border: active ? "1px solid rgba(16,185,129,.4)" : "1px solid rgba(255,255,255,.08)",
                        borderRadius: 999,
                        padding: "6px 14px",
                        fontSize: 11,
                        fontWeight: active ? 600 : 400,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        boxShadow: active ? "0 2px 10px rgba(16,185,129,.15)" : "none",
                      }}
                    >
                      {city}
                    </button>
                  );
                })}
              </div>
            )}

            <input
              value={scholarshipQ}
              onChange={e => setScholarshipQ(e.target.value)}
              placeholder="🔍  Search by name, eligibility, criteria..."
              style={{ width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, padding: "10px 16px", color: "#e0e0ea", fontSize: 12, outline: "none", marginBottom: 14, boxSizing: "border-box", transition: "border-color .2s" }}
              onFocus={e => e.target.style.borderColor = "rgba(20,184,166,.4)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"}
            />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,rgba(20,184,166,.14),rgba(20,184,166,.06))", border: "1px solid rgba(20,184,166,.26)", borderRadius: 10, padding: "6px 9px" }}>
                <span style={{ color: "#8be7dc", fontSize: 12, lineHeight: 1 }}>⇅</span>
                <span style={{ color: "#f3d4a0", fontSize: 11 }}>Sort by</span>
                <div style={{ position: "relative" }}>
                  <select
                    value={scholarshipSort}
                    onChange={e => setScholarshipSort(e.target.value)}
                    style={{ appearance: "none", WebkitAppearance: "none", MozAppearance: "none", background: "rgba(0,0,0,.18)", border: "1px solid rgba(255,255,255,.16)", borderRadius: 7, color: "#f0f0f0", padding: "5px 24px 5px 9px", fontSize: 11, outline: "none", cursor: "pointer" }}
                  >
                    <option value="recommended">Recommended</option>
                    <option value="amount_desc">Highest Amount</option>
                    <option value="deadline_soon">Deadline Priority</option>
                    <option value="name_asc">A-Z</option>
                  </select>
                  <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-52%)", color: "#b8b8b8", fontSize: 10, pointerEvents: "none" }}>▼</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, margin: "0 0 10px" }}>
              <p style={{ color: "#48485a", fontSize: 11, margin: 0 }}>
                <span style={{ color: "#5eead4", fontWeight: 600 }}>{sortedScholarships.length}</span> scholarships
              </p>
              {scholarshipFiltersActive && (
                <button
                  className="fx-btn"
                  onClick={() => {
                    setScholarshipFilter("All");
                    setScholarshipCity("All Cities");
                    setScholarshipQ("");
                    setScholarshipSort("recommended");
                  }}
                  style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)", color: "#b0b0c0", borderRadius: 8, padding: "5px 12px", fontSize: 10, cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  ✕ Clear filters
                </button>
              )}
            </div>

            {sortedScholarships.map((s, i) => (
              <div className="card-3d" key={i}
                style={{ background: "linear-gradient(135deg,rgba(255,255,255,.05),rgba(255,255,255,.02))", border: "1px solid rgba(255,255,255,.1)", borderLeft: "3px solid rgba(20,184,166,.5)", borderRadius: "4px 16px 16px 4px", padding: "18px 20px", marginBottom: 12, backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)" }}
                onMouseEnter={e => { e.currentTarget.style.borderLeftColor="rgba(20,184,166,.9)"; e.currentTarget.style.background="linear-gradient(135deg,rgba(20,184,166,.08),rgba(20,184,166,.03))"; e.currentTarget.style.boxShadow="0 12px 40px rgba(20,184,166,.15), 0 0 0 1px rgba(20,184,166,.18)"; e.currentTarget.style.transform="translateY(-3px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderLeftColor="rgba(20,184,166,.5)"; e.currentTarget.style.background="linear-gradient(135deg,rgba(255,255,255,.05),rgba(255,255,255,.02))"; e.currentTarget.style.boxShadow="none"; e.currentTarget.style.transform="translateY(0)"; }}>
                <div style={{ display: "flex", flexDirection: isPhone ? "column" : "row", justifyContent: "space-between", alignItems: isPhone ? "stretch" : "flex-start", marginBottom: 12, gap: 10 }}>
                  <div>
                    <h3 style={{ margin: "0 0 6px", color: "#f0f0f8", fontSize: 14, fontWeight: 700, letterSpacing: "-.2px", fontFamily:"'Outfit',sans-serif" }}>{s.name}</h3>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#5eead4", background: "linear-gradient(135deg,rgba(20,184,166,.2),rgba(20,184,166,.08))", border: "1px solid rgba(20,184,166,.3)", padding: "4px 12px", borderRadius: 10, letterSpacing: "-.2px", display: "inline-block", marginTop: 4, boxShadow:"0 2px 12px rgba(20,184,166,.2)" }}>{s.amount}</span>
                    <div style={{ marginTop: 8, display:"flex", gap:6, flexWrap:"wrap" }}>
                      <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.06)", color: "#9898b8", fontWeight:500 }}>{s.category}</span>
                      {s.category === "College-wise" && (
                        <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(16,185,129,.3)", background: "rgba(16,185,129,.12)", color: "#6ee7b7", fontWeight:500 }}>{s.city}</span>
                      )}
                    </div>
                  </div>
                  <a className="apply-btn" href={s.url} target="_blank" rel="noreferrer" style={{ background: "linear-gradient(135deg,#14b8a6,#2dd4bf)", borderRadius: 10, padding: "8px 18px", color: "#000", fontSize: 12, fontWeight: 800, textDecoration: "none", flexShrink: 0, alignSelf: isPhone ? "flex-start" : "auto", boxShadow:"0 4px 16px rgba(20,184,166,.4)", fontFamily:"'Outfit',sans-serif", letterSpacing:"-.2px" }}>Apply →</a>
                </div>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                  {[["📅 Deadline", s.deadline], ["🎓 Criteria", s.gpa], ["✅ Eligibility", s.eligibility]].map(([l, v]) => (
                    <div key={l}>
                      <p style={{ margin: "0 0 3px", fontSize: 8, color: "#48486a", textTransform: "uppercase", letterSpacing: "1.2px", fontWeight: 700 }}>{l}</p>
                      <p style={{ margin: 0, fontSize: 11.5, color: "#8888a8", lineHeight:1.4 }}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {sortedScholarships.length === 0 && (
              <div style={{ textAlign: "center", padding: "28px 0 8px" }}>
                <p style={{ color: "#48485a", fontSize: 14, margin: 0 }}>No scholarships match your search.</p>
                <p style={{ color: "#38384a", fontSize: 12, marginTop: 6 }}>Try adjusting your filters or search query.</p>
              </div>
            )}
            <div style={{ background: "linear-gradient(135deg,rgba(var(--secondary-deep-rgb),.08),rgba(var(--secondary-deep-rgb),.04))", border: "1px solid rgba(var(--secondary-deep-rgb),.18)", borderRadius: 12, padding: "14px 18px", marginTop: 10 }}>
              <p style={{ margin: 0, fontSize: 12, color: "#8888a8", lineHeight: 1.7 }}>💡 <strong style={{ color: "#c0c0d8" }}>Pro tip:</strong> Apply to as many as you're eligible for — even small ones add up. Set calendar reminders for every deadline!</p>
            </div>
          </div>
        )}

        {/* TRUSTCHAIN */}
        {tab === "trustchain" && (
          <div style={{ ...C.scroll, animation: "fadeIn .35s ease" }}>
            <h2 className="section-accent" style={{ color: "#f1f1f6", fontSize: 19, margin: "0 0 5px", fontWeight: 700, letterSpacing: "-.3px" }}>⛓️ TrustChain Center</h2>
            <p style={{ color: "#52526a", fontSize: 12, marginBottom: 14 }}>Fraud prevention + professor intelligence for safer college decisions, verified records, and trusted academic guidance.</p>

            <div className="trust-toolbar">
              <div className="trust-chip-wrap">
                <button className={`trust-chip ${trustFeature === "all" ? "active" : ""}`} onClick={() => setTrustFeature("all")}>All Modules</button>
                {TRUSTCHAIN_FEATURES.map((feature) => (
                  <button
                    key={feature.id}
                    className={`trust-chip ${trustFeature === feature.id ? "active" : ""}`}
                    onClick={() => setTrustFeature(feature.id)}
                  >
                    {feature.label}
                  </button>
                ))}
              </div>
              <div className="trust-search-row">
                <input
                  value={trustQ}
                  onChange={(e) => setTrustQ(e.target.value)}
                  placeholder="Search by college name (e.g., ABC University)"
                  className="trust-search"
                />
                <button className="trust-clear" onClick={() => { setTrustFeature("all"); setTrustQ(""); }}>Clear</button>
                <button className="trust-clear" onClick={() => setTrustVerdicts({})}>Clear decisions</button>
              </div>
            </div>

            <div className="trust-help-box">
              <div className="trust-summary-row">
                <span className="trust-summary-total">Decisions: {verdictTotal}</span>
                {VERDICT_OPTIONS.map((option) => (
                  <span key={option.id} className={`trust-summary-pill ${option.tone}`}>
                    {option.label}: {verdictCounts[option.id] || 0}
                  </span>
                ))}
              </div>
              {selectedTrustFeature ? (
                <p><strong>{selectedTrustFeature.label}:</strong> {selectedTrustFeature.help}</p>
              ) : (
                <p><strong>How to use:</strong> Select one module to focus, then use search to quickly find the protection tool you need.</p>
              )}
            </div>

            <div className="chain-grid">
              {isTrustFeatureVisible("student-feedback") && <div className="chain-card">
                <div className="chain-head"><h3>💬 Student Feedback</h3><span className="verify-chip">Verified Voices</span></div>
                {filteredStudentFeedback.map((item, i) => (
                  <div key={i} className="chain-row">
                    <p><strong>{item.college}</strong></p>
                    <p>Course: {item.course} · Rating: {item.rating}/5</p>
                    <p>Wallet: {item.wallet}</p>
                    <p>{item.note}</p>
                  </div>
                ))}
                {filteredStudentFeedback.length === 0 && <div className="chain-row compact"><p>No student feedback found for this college search.</p></div>}
              </div>}

              {isTrustFeatureVisible("credit-score") && <div className="chain-card">
                <div className="chain-head"><h3>📊 College Credit Score</h3><span className="verify-chip">Credibility Meter</span></div>
                {filteredCreditScores.map((item, i) => (
                  <div key={i} className="chain-row">
                    <p><strong>#{item.rank} {item.college}</strong></p>
                    <p>Credit Score: <span className="score-highlight">{item.creditScore}/900</span></p>
                    <p>Band: {item.band}</p>
                    <p>Trust Score: {item.trustScore}/10 · Reviews: {item.count}</p>
                  </div>
                ))}
                {filteredCreditScores.length === 0 && <div className="chain-row compact"><p>No credit score found for this college search.</p></div>}
              </div>}

              {isTrustFeatureVisible("admission-checker") && <div className="chain-card">
                <div className="chain-head"><h3>📋 Admission Checker</h3><span className="verify-chip">Document Hash Match</span></div>
                {filteredAdmissionLetters.map((item, i) => (
                  <div key={i} className="chain-row">
                    <p>
                      <strong>Student:</strong>{" "}
                      {revealedAdmissionIndex === i ? item.student : "Hidden"}
                      <button
                        type="button"
                        className="inline-link"
                        onClick={() => setRevealedAdmissionIndex(revealedAdmissionIndex === i ? null : i)}
                      >
                        {revealedAdmissionIndex === i ? "Hide" : "Tap to show"}
                      </button>
                    </p>
                    <p><strong>College:</strong> {item.college}</p>
                    {!collegeSearchActive && <>
                      <p>Admission Letter Status: {item.status === "Verified" ? "Verified ✔" : "Warning: Document not found"}</p>
                      <p>Date: {item.date}</p>
                      <p>Blockchain Hash: {item.hash}</p>
                    </>}
                    {renderVerdictControls("admission-checker", `${item.college}-${item.student}-${i}`)}
                  </div>
                ))}
                {filteredAdmissionLetters.length === 0 && <div className="chain-row compact"><p>No admission record found for this college search.</p></div>}
              </div>}

              {isTrustFeatureVisible("agent-verification") && <div className="chain-card">
                <div className="chain-head"><h3>🛡️ Agent Verification</h3><span className="verify-chip">Fraud Shield</span></div>
                {VERIFIED_AGENTS.map((item, i) => (
                  <div key={i} className="chain-row">
                    <p><strong>Agent:</strong> {item.name}</p>
                    <p>Status: {item.status === "Verified" ? "Verified ✔" : "Watchlist ⚠"}</p>
                    <p>Complaints: {item.complaints} · Fraud Reports: {item.fraudReports}</p>
                    <p>Trust Score: <span className="score-highlight">{item.trust}/10</span></p>
                    {renderVerdictControls("agent-verification", `${item.name}-${i}`)}
                  </div>
                ))}
              </div>}

              {isTrustFeatureVisible("fee-safety") && <div className="chain-card">
                <div className="chain-head"><h3>🏦 Fee Safety</h3><span className="verify-chip">Official Payment Channels</span></div>
                {filteredPaymentChannels.map((item, i) => (
                  <div key={i} className="chain-row">
                    <p><strong>College Fee Payment:</strong> {item.college}</p>
                    {!collegeSearchActive && <>
                      <p>Official Bank: {item.bank}</p>
                      <p>Account Status: {item.accountStatus} ✔</p>
                      <p>UPI: {item.upi}</p>
                    </>}
                    {(() => {
                      const key = getPaymentFormKey(item);
                      const form = getPaymentForm(item);
                      const recent = trustPayments.filter((p) => p.college === item.college).slice(0, 3);
                      return (
                        <div className="payment-capture">
                          <label>
                            Student ID
                            <input
                              type="text"
                              value={form.studentId}
                              onChange={(e) => setPaymentField(item, "studentId", e.target.value)}
                              placeholder="e.g. STU-1022"
                            />
                          </label>
                          <label>
                            Amount Paid (INR)
                            <input
                              type="number"
                              min="1"
                              value={form.amount}
                              onChange={(e) => setPaymentField(item, "amount", e.target.value)}
                              placeholder="e.g. 25000"
                            />
                          </label>
                          <label>
                            Transaction Ref (optional)
                            <input
                              type="text"
                              value={form.transactionRef}
                              onChange={(e) => setPaymentField(item, "transactionRef", e.target.value)}
                              placeholder="UTR / Txn ID"
                            />
                          </label>
                          <button
                            type="button"
                            className="payment-save-btn"
                            disabled={paymentBusyKey === key}
                            onClick={() => submitPaymentRecord(item)}
                          >
                            {paymentBusyKey === key ? "Saving..." : "Mark Payment Done"}
                          </button>

                          {!!recent.length && (
                            <div className="payment-recent">
                              <strong>Recent records:</strong>
                              <ul>
                                {recent.map((entry) => (
                                  <li key={entry.id}>
                                    {entry.studentId} • ₹{entry.amount} • {new Date(entry.createdAt).toLocaleDateString()}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    {renderVerdictControls("fee-safety", `${item.college}-${i}`)}
                  </div>
                ))}
                {filteredPaymentChannels.length === 0 && <div className="chain-row compact"><p>No verified payment channel for this college search.</p></div>}
                {!!paymentError && <p className="rating-error">{paymentError}</p>}

                <div className="payment-admin">
                  <div className="payment-admin-head">
                    <h4>Saved Student Payments</h4>
                    <button type="button" className="payment-export-btn" onClick={exportPaymentsCsv}>Export CSV</button>
                  </div>

                  <div className="payment-filter-tabs">
                    {paymentCollegeOptions.map((college) => (
                      <button
                        key={college}
                        type="button"
                        className={`trust-chip ${paymentCollegeFilter === college ? "active" : ""}`}
                        onClick={() => setPaymentCollegeFilter(college)}
                      >
                        {college}
                      </button>
                    ))}
                  </div>

                  {filteredPaymentRecords.length === 0 ? (
                    <div className="chain-row compact"><p>No payment records found for this college filter.</p></div>
                  ) : (
                    <div className="payment-admin-list">
                      {filteredPaymentRecords.map((entry) => {
                        const isEditing = paymentEditId === entry.id;
                        const isBusy = paymentAdminBusyId === `edit:${entry.id}` || paymentAdminBusyId === `delete:${entry.id}`;

                        return (
                          <div key={entry.id} className="payment-admin-row">
                            <p><strong>{entry.college}</strong> · {entry.bank || "Bank not set"}</p>
                            <p>Student: {entry.studentId} · Amount: ₹{entry.amount} · {new Date(entry.createdAt).toLocaleString()}</p>
                            <p>Txn Ref: {entry.transactionRef || "-"}</p>
                            {!!entry.note && <p>Note: {entry.note}</p>}

                            {isEditing ? (
                              <div className="payment-edit-form">
                                <input
                                  type="text"
                                  value={paymentEditForm.studentId}
                                  onChange={(e) => setPaymentEditForm((prev) => ({ ...prev, studentId: e.target.value }))}
                                  placeholder="Student ID"
                                />
                                <input
                                  type="number"
                                  min="1"
                                  value={paymentEditForm.amount}
                                  onChange={(e) => setPaymentEditForm((prev) => ({ ...prev, amount: e.target.value }))}
                                  placeholder="Amount"
                                />
                                <input
                                  type="text"
                                  value={paymentEditForm.transactionRef}
                                  onChange={(e) => setPaymentEditForm((prev) => ({ ...prev, transactionRef: e.target.value }))}
                                  placeholder="Transaction Ref"
                                />
                                <input
                                  type="text"
                                  value={paymentEditForm.note}
                                  onChange={(e) => setPaymentEditForm((prev) => ({ ...prev, note: e.target.value }))}
                                  placeholder="Note"
                                />
                                <div className="payment-admin-actions">
                                  <button type="button" className="payment-save-btn" disabled={isBusy} onClick={() => saveEditedPayment(entry.id)}>
                                    {isBusy ? "Saving..." : "Save"}
                                  </button>
                                  <button type="button" className="payment-cancel-btn" disabled={isBusy} onClick={cancelEditPayment}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div className="payment-admin-actions">
                                <button type="button" className="payment-edit-btn" disabled={isBusy} onClick={() => startEditPayment(entry)}>Edit</button>
                                <button
                                  type="button"
                                  className="payment-delete-btn"
                                  disabled={isBusy}
                                  onClick={() => deletePaymentRecord(entry.id)}
                                >
                                  {paymentAdminBusyId === `delete:${entry.id}` ? "Deleting..." : "Delete"}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {!!paymentAdminMessage && <p className="payment-admin-msg">{paymentAdminMessage}</p>}
                </div>
              </div>}

              {isTrustFeatureVisible("placement-detector") && <div className="chain-card">
                <div className="chain-head"><h3>📈 Placement Audit</h3><span className="verify-chip">Data Audit</span></div>
                {filteredPlacementAudits.map((item, i) => (
                  <div key={i} className="chain-row">
                    <p><strong>{item.college}</strong></p>
                    {!collegeSearchActive && <>
                      <p>Placement Claim: {item.claim}%</p>
                      <p>Verified Estimate: {item.estimate}%</p>
                      <p>{item.signal}</p>
                    </>}
                    {renderVerdictControls("placement-detector", `${item.college}-${i}`)}
                  </div>
                ))}
                {filteredPlacementAudits.length === 0 && <div className="chain-row compact"><p>No placement audit found for this college search.</p></div>}
              </div>}

              {isTrustFeatureVisible("fraud-reports") && <div className="chain-card">
                <div className="chain-head"><h3>🚨 Fraud Reports</h3><span className="verify-chip">Community Protection</span></div>
                {FRAUD_REPORTS.map((item, i) => (
                  <div key={i} className="chain-row">
                    <p><strong>Reported Issue:</strong> {item.issue}</p>
                    <p>Target: {item.target}</p>
                    <p>Status: {item.status}</p>
                    <p>Evidence: {item.evidence}</p>
                    {renderVerdictControls("fraud-reports", `${item.issue}-${i}`)}
                  </div>
                ))}
              </div>}

              {isTrustFeatureVisible("professor-verification") && <div className="chain-card">
                <div className="chain-head"><h3>👨‍🏫 Professor Verify</h3><span className="verify-chip">Faculty Trust</span></div>
                {VERIFIED_PROFESSORS.map((item, i) => (
                  <div key={i} className="chain-row">
                    <p><strong>Professor:</strong> {item.name}</p>
                    <p>{item.phd} ✔ · Publications: {item.publications}</p>
                    <p>Teaching Experience: {item.experience}</p>
                    <p>Affiliation: {item.affiliation}</p>
                    {renderVerdictControls("professor-verification", `${item.name}-${i}`)}
                  </div>
                ))}
              </div>}

              {isTrustFeatureVisible("internships") && <div className="chain-card">
                <div className="chain-head"><h3>💼 Verified Internships</h3><span className="verify-chip">Company Verified</span></div>
                {VERIFIED_INTERNSHIPS.map((item, i) => (
                  <div key={i} className="chain-row">
                    <p><strong>Company:</strong> {item.company}</p>
                    <p>Internship Type: {item.role}</p>
                    <p>Salary Range: {item.stipend}</p>
                    <p>Verification Status: {item.status} ✔</p>
                    {renderVerdictControls("internships", `${item.company}-${item.role}-${i}`)}
                  </div>
                ))}
              </div>}

              {isTrustFeatureVisible("professor-help") && <div className="chain-card">
                <div className="chain-head"><h3>🤝 Professor Help</h3><span className="verify-chip">Professor Workspace</span></div>
                {PROFESSOR_HELP_SYSTEM.map((item, i) => (
                  <div key={i} className="chain-row">
                    <p><strong>{item.type}</strong> · Topic: {item.topic}</p>
                    <p>Professor: {item.professor}</p>
                    <p>Date: {item.date}</p>
                    {renderVerdictControls("professor-help", `${item.professor}-${item.topic}-${i}`)}
                  </div>
                ))}
              </div>}

              {isTrustFeatureVisible("academic-risk") && <div className="chain-card">
                <div className="chain-head"><h3>⚠️ Academic Risk</h3><span className="verify-chip">Course Fit Alert</span></div>
                {ACADEMIC_RISK_WARNINGS.map((item, i) => (
                  <div key={i} className="chain-row">
                    <p><strong>Selected Course:</strong> {item.course}</p>
                    <p>Math Requirement: {item.mathNeed} · Your Math Score: {item.studentMath}</p>
                    <p>Recommendation: {item.recommendation}</p>
                    {renderVerdictControls("academic-risk", `${item.course}-${i}`)}
                  </div>
                ))}
              </div>}

              {isTrustFeatureVisible("digital-identity") && <div className="chain-card">
                <div className="chain-head"><h3>🔐 Digital Identity</h3><span className="verify-chip">Identity Vault</span></div>
                {STUDENT_DIGITAL_IDENTITY.map((item, i) => (
                  <div key={i} className="chain-row">
                    <p><strong>Profile ID:</strong> {item.id}</p>
                    <p>{item.records}</p>
                    <p>Scholarship Applications: {item.scholarshipReady}</p>
                    {renderVerdictControls("digital-identity", `${item.id}-${i}`)}
                  </div>
                ))}
              </div>}

              {isTrustFeatureVisible("fee-breakdown") && <div className="chain-card">
                <div className="chain-head"><h3>💰 Fee Breakdown</h3><span className="verify-chip">No Hidden Charges</span></div>
                {filteredFeeBreakdown.map((item, i) => (
                  <div key={i} className="chain-row">
                    <p><strong>{item.college}</strong></p>
                    {!collegeSearchActive && <>
                      <p>Tuition: {item.tuition} · Hostel: {item.hostel}</p>
                      <p>Exam Fee: {item.exam}</p>
                      <p>Hidden Charges: {item.hidden} ✔</p>
                    </>}
                    {renderVerdictControls("fee-breakdown", `${item.college}-${i}`)}
                  </div>
                ))}
                {filteredFeeBreakdown.length === 0 && <div className="chain-row compact"><p>No fee breakdown found for this college search.</p></div>}
              </div>}

              {isTrustFeatureVisible("infra-check") && <div className="chain-card">
                <div className="chain-head"><h3>🏗️ Infrastructure Check</h3><span className="verify-chip">Geo Verified</span></div>
                {filteredInfraCheck.map((item, i) => (
                  <div key={i} className="chain-row">
                    <p><strong>{item.college}</strong></p>
                    {!collegeSearchActive && <>
                      <p>Campus Images: {item.status}</p>
                      <p>Verification Source: {item.source}</p>
                    </>}
                    {renderVerdictControls("infra-check", `${item.college}-${i}`)}
                  </div>
                ))}
                {filteredInfraCheck.length === 0 && <div className="chain-row compact"><p>No infrastructure record found for this college search.</p></div>}
              </div>}

            </div>

            {visibleTrustFeatureCount === 0 && (
              <div className="trust-empty">No TrustChain module matches your filter. Try a broader search.</div>
            )}
          </div>
        )}

        {/* WALLET */}
        {tab === "wallet" && (
          <div style={{...C.scroll, animation: "fadeIn .35s ease"}}>
            <h2 className="section-accent" style={{ color: "#f1f1f6", fontSize: 19, margin: "0 0 5px", fontWeight: 700, letterSpacing: "-.3px" }}>🗂️ Student Wallet</h2>
            <p style={{ color: "#52526a", fontSize: 12, marginBottom: 16 }}>Keep your documents, fee receipts, and important files in one place.</p>

            <div className="wallet-session glass-card">
              <p><strong>Wallet Login:</strong> Use your Student ID to load only your files.</p>
              <div className="wallet-session-row">
                <input
                  type="text"
                  value={walletStudentDraftId}
                  onChange={(e) => setWalletStudentDraftId(e.target.value)}
                  placeholder="Enter Student ID (e.g. STU-1022)"
                />
                <button type="button" className="wallet-save-btn" onClick={loginWalletStudent}>Use ID</button>
                {!!walletStudentId && <button type="button" className="wallet-delete-btn" onClick={logoutWalletStudent}>Logout</button>}
              </div>
              {!!walletStudentId && <p className="wallet-msg">Active Student ID: {walletStudentId}</p>}
            </div>

            <div className="wallet-grid">
              <div className="wallet-panel glass-card">
                <h3>Add New File</h3>
                <label>Title
                  <input
                    type="text"
                    value={walletDraft.title}
                    onChange={(e) => setWalletDraft((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Semester 1 Fee Receipt"
                  />
                </label>
                <label>Category
                  <select
                    value={walletDraft.category}
                    onChange={(e) => setWalletDraft((prev) => ({ ...prev, category: e.target.value }))}
                  >
                    {WALLET_CATEGORIES.filter((c) => c !== "All").map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </label>
                <label>Notes (optional)
                  <textarea
                    value={walletDraft.note}
                    onChange={(e) => setWalletDraft((prev) => ({ ...prev, note: e.target.value }))}
                    placeholder="Any details like date, semester, or reminders"
                    rows={3}
                  />
                </label>
                <label>File
                  <input
                    ref={walletFileRef}
                    type="file"
                    onChange={onWalletFileChange}
                  />
                </label>

                <button type="button" className="wallet-save-btn" disabled={walletBusy || !walletStudentId} onClick={addWalletItem}>
                  {walletBusy ? "Saving..." : "Save In Wallet"}
                </button>
                {!!walletMessage && <p className="wallet-msg">{walletMessage}</p>}
              </div>

              <div className="wallet-panel glass-card">
                <div className="wallet-list-head">
                  <h3>Saved Files</h3>
                  <span>{filteredWalletItems.length} item(s)</span>
                </div>

                <div className="wallet-filters">
                  {WALLET_CATEGORIES.map((category) => (
                    <button
                      key={category}
                      type="button"
                      className={`trust-chip ${walletFilter === category ? "active" : ""}`}
                      onClick={() => setWalletFilter(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {!walletStudentId ? (
                  <div className="chain-row compact"><p>Login with Student ID to see your wallet files.</p></div>
                ) : filteredWalletItems.length === 0 ? (
                  <div className="chain-row compact"><p>No files in this category yet.</p></div>
                ) : (
                  <div className="wallet-list">
                    {filteredWalletItems.map((item) => (
                      <div key={item.id} className="wallet-item">
                        <p><strong>{item.title}</strong></p>
                        <p>{item.category} · {item.fileName || "file"} · {formatFileSize(item.fileSize)}</p>
                        <p>{new Date(item.createdAt).toLocaleString()}</p>
                        {!!item.note && <p>Note: {item.note}</p>}

                        <div className="wallet-actions">
                          <a href={buildApiUrl(`${item.downloadPath || `${WALLET_ITEMS_PATH}/${item.id}/download`}?studentId=${encodeURIComponent(walletStudentId)}`)} download={item.fileName || `${item.title}.file`} className="wallet-link-btn">Download</a>
                          <a href={buildApiUrl(`${item.downloadPath || `${WALLET_ITEMS_PATH}/${item.id}/download`}?studentId=${encodeURIComponent(walletStudentId)}`)} target="_blank" rel="noreferrer" className="wallet-link-btn">Open</a>
                          <button type="button" className="wallet-delete-btn" onClick={() => deleteWalletItem(item.id)}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* GLOSSARY */}
        {tab === "glossary" && (
          <div style={{...C.scroll, animation: "fadeIn .35s ease"}}>
            <h2 className="section-accent" style={{ color: "#f1f1f6", fontSize: 19, margin: "0 0 5px", fontWeight: 700, letterSpacing: "-.3px" }}>📖 College Glossary</h2>
            <p style={{ color: "#52526a", fontSize: 12, marginBottom: 16 }}>All the terms nobody explains — decoded.</p>
            <input value={glossQ} onChange={e => setGlossQ(e.target.value)} placeholder="🔍  Search terms..."
              style={{ width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, padding: "10px 16px", color: "#e0e0ea", fontSize: 12, outline: "none", marginBottom: 14, boxSizing: "border-box", transition: "border-color .2s" }}
              onFocus={e => e.target.style.borderColor = "rgba(20,184,166,.4)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"}
            />
            {filtGloss.map((g, i) => (
              <div key={i} className="glass-card" style={{ borderRadius: 14, padding: "15px 18px", marginBottom: 8, display: "flex", flexDirection: isPhone ? "column" : "row", gap: 16, alignItems: "flex-start", transition:"all .2s" }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor="rgba(20,184,166,.3)"; e.currentTarget.style.boxShadow="0 6px 28px rgba(20,184,166,.1)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor="rgba(255,255,255,.09)"; e.currentTarget.style.boxShadow="none"; }}>
                <span style={{ color: "#5eead4", fontWeight: 800, fontSize: 13, minWidth: isPhone ? "auto" : 140, flexShrink: 0, fontFamily:"'Outfit',sans-serif" }}>{g.term}</span>
                <p style={{ margin: 0, color: "#8888a8", fontSize: 12.5, lineHeight: 1.7 }}>{g.def}</p>
              </div>
            ))}
            {filtGloss.length === 0 && <p style={{ color: "#38384a", textAlign: "center", padding: 40 }}>No terms found.</p>}
          </div>
        )}

        {/* EMAIL TEMPLATES */}
        {tab === "emails" && (
          <div style={{...C.scroll, animation: "fadeIn .35s ease"}}>
            <h2 className="section-accent" style={{ color: "#f1f1f6", fontSize: 19, margin: "0 0 5px", fontWeight: 700, letterSpacing: "-.3px" }}>📧 Email Templates</h2>
            <p style={{ color: "#52526a", fontSize: 12, marginBottom: 20 }}>Copy, fill in the blanks, send. Professional emails made easy.</p>
            {EMAILS.map((email, i) => (
              <div key={i} className="glass-card card-3d" style={{ borderRadius: 16, overflow: "hidden", marginBottom: 12 }}>
                <div style={{ padding: "15px 19px", display: "flex", justifyContent: "space-between", alignItems: isPhone ? "flex-start" : "center", cursor: "pointer", borderBottom: openEmail === i ? "1px solid rgba(255,255,255,.08)" : "none", gap: 10, transition:"background .18s" }}
                  onClick={() => setOpenEmail(openEmail === i ? null : i)}
                  onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,.04)"}
                  onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 18 }}>📧</span>
                    <div>
                      <p style={{ margin: "0 0 4px", color: "#f0f0f8", fontSize: 13, fontWeight: 700, letterSpacing: "-.15px", fontFamily:"'Outfit',sans-serif" }}>{email.title}</p>
                      <span style={{ fontSize: 10, padding: "2px 9px", borderRadius: 20, background: `${TAG_COLORS[email.tag]}22`, color: TAG_COLORS[email.tag], fontWeight: 600, border:`1px solid ${TAG_COLORS[email.tag]}44` }}>{email.tag}</span>
                    </div>
                  </div>
                  <span style={{ color: "#48486a", fontSize: 11, fontWeight:600 }}>{openEmail === i ? "▲" : "▼"}</span>
                </div>
                {openEmail === i && (
                  <div style={{ padding: "16px 19px" }}>
                    <p style={{ margin: "0 0 6px", fontSize: 9, color: "#48486a", textTransform: "uppercase", letterSpacing: "1.3px", fontWeight: 700 }}>Subject</p>
                    <div style={{ background: "linear-gradient(135deg,rgba(20,184,166,.1),rgba(20,184,166,.04))", border: "1px solid rgba(20,184,166,.22)", borderRadius: 10, padding: "9px 14px", marginBottom: 14 }}>
                      <p style={{ margin: 0, color: "#5eead4", fontSize: 13, fontWeight: 600, fontFamily:"'Outfit',sans-serif" }}>{email.subject}</p>
                    </div>
                    <p style={{ margin: "0 0 6px", fontSize: 9, color: "#48486a", textTransform: "uppercase", letterSpacing: "1.3px", fontWeight: 700 }}>Body</p>
                    <pre style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 10, padding: "13px 15px", color: "#8888a8", fontSize: 11.5, fontFamily: "'Outfit','Inter',ui-monospace,monospace", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.8, margin: "0 0 14px" }}>{email.body}</pre>
                    <button className="fx-btn" onClick={() => copyEmail(i, `Subject: ${email.subject}\n\n${email.body}`)}
                      style={{ background: copied === i ? "linear-gradient(135deg,rgba(16,185,129,.2),rgba(16,185,129,.08))" : "linear-gradient(135deg,rgba(20,184,166,.22),rgba(20,184,166,.08))", border: `1px solid ${copied === i ? "rgba(16,185,129,.4)" : "rgba(20,184,166,.35)"}`, borderRadius: 10, padding: "8px 18px", color: copied === i ? "#34d399" : "#5eead4", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all .2s", fontFamily:"'Outfit',sans-serif" }}>
                      {copied === i ? "✓ Copied!" : "📋 Copy Template"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* RESOURCE LINKS */}
        {tab === "links" && (
          <div style={{...C.scroll, animation: "fadeIn .35s ease"}}>
            <h2 className="section-accent" style={{ color: "#f1f1f6", fontSize: 19, margin: "0 0 5px", fontWeight: 700, letterSpacing: "-.3px" }}>🔗 Essential Resources</h2>
            <p style={{ color: "#52526a", fontSize: 12, marginBottom: 14 }}>The best free tools and websites for college students.</p>
            <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
              {linkTags.map(tag => (
                <button className="fx-btn" key={tag} onClick={() => setLinkFilter(tag)}
                  style={{ padding: "5px 14px", borderRadius: 20, border: "1px solid", borderColor: linkFilter === tag ? (TAG_COLORS[tag] || "#14b8a6") : "rgba(255,255,255,.09)", background: linkFilter === tag ? `${TAG_COLORS[tag] || "#14b8a6"}16` : "rgba(255,255,255,.04)", color: linkFilter === tag ? (TAG_COLORS[tag] || "#14b8a6") : "#52526a", fontSize: 11, fontWeight: linkFilter === tag ? 600 : 400, cursor: "pointer", transition: "all .2s" }}>
                  {tag}
                </button>
              ))}
            </div>
            <div className="perspective-layer" style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 1fr", gap: 12 }}>
              {filtLinks.map((link, i) => (
                <a className="link-card" key={i} href={link.url} target="_blank" rel="noreferrer"
                  style={{ background: "linear-gradient(135deg,rgba(255,255,255,.05),rgba(255,255,255,.02))", border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, padding: "18px 18px", textDecoration: "none", display: "block", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 22, lineHeight:1 }}>{link.icon}</span>
                    <span style={{ color: "#f0f0f8", fontSize: 14, fontWeight: 700, letterSpacing: "-.2px", fontFamily:"'Outfit',sans-serif" }}>{link.name}</span>
                  </div>
                  <p style={{ margin: "0 0 10px", color: "#6a6a88", fontSize: 11, lineHeight: 1.65 }}>{link.desc}</p>
                  <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: `${TAG_COLORS[link.tag]}20`, color: TAG_COLORS[link.tag], fontWeight: 600, border:`1px solid ${TAG_COLORS[link.tag]}40` }}>{link.tag}</span>
                </a>
              ))}
            </div>
          </div>
        )}

      </div>

      <style>{`
        * { font-family: 'Outfit','Inter',system-ui,sans-serif; }

        .ambient-grid{
          position:fixed;
          inset:0;
          pointer-events:none;
          z-index:0;
          opacity:.28;
          background-image:linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
          background-size:32px 32px;
          mask-image:radial-gradient(circle at 50% 42%, black 35%, transparent 90%);
          -webkit-mask-image:radial-gradient(circle at 50% 42%, black 35%, transparent 90%);
        }

        @keyframes pulse{0%,100%{opacity:.28;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}
        @keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-8px)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes logoPulse{
          0%,100%{box-shadow:0 4px 20px rgba(20,184,166,.5),0 0 0 0 rgba(20,184,166,.15),inset 0 1px 0 rgba(255,255,255,.3)}
          50%{box-shadow:0 6px 36px rgba(20,184,166,.75),0 0 0 10px rgba(20,184,166,.04),inset 0 1px 0 rgba(255,255,255,.3)}
        }
        @keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes orbFloat{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-20px) scale(1.05)}66%{transform:translate(-20px,25px) scale(.96)}}
        @keyframes orbFloat2{0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(-40px,30px) scale(1.08)}70%{transform:translate(25px,-18px) scale(.94)}}
        @keyframes orbFloat3{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(35px,20px) scale(1.06)}}
        @keyframes sectionIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{left:-60%;opacity:0}50%{opacity:.5}100%{left:160%;opacity:0}}
        @keyframes subtleGlow{0%,100%{box-shadow:0 0 0 0 rgba(20,184,166,0)}50%{box-shadow:0 0 14px 2px rgba(20,184,166,.07)}}
        @keyframes titleSweep{0%,80%{transform:translateX(-130%) skewX(-16deg);opacity:0}85%{opacity:.62}95%{opacity:.44}100%{transform:translateX(180%) skewX(-16deg);opacity:0}}
        @keyframes topicEntry{0%{opacity:0;transform:translateY(6px) scale(.985)}100%{opacity:1;transform:translateY(0) scale(1)}}

        .orb{position:absolute;border-radius:50%;filter:blur(80px);opacity:.08;pointer-events:none}
        .orb-1{width:480px;height:480px;top:-120px;left:-120px;background:radial-gradient(circle,#14b8a6,#2dd4bf);animation:orbFloat 18s ease-in-out infinite}
        .orb-2{width:560px;height:560px;bottom:-140px;right:-100px;background:radial-gradient(circle,#6366f1,#8b5cf6);animation:orbFloat2 22s ease-in-out infinite}
        .orb-3{width:360px;height:360px;top:40%;left:50%;margin-left:-180px;background:radial-gradient(circle,#10b981,#34d399);animation:orbFloat3 16s ease-in-out infinite}

        .typing-cursor{animation:blink .85s step-end infinite;color:#5eead4;font-size:15px;line-height:1;margin-left:2px;vertical-align:sub}

        .brand-shell{position:relative;overflow:hidden;transform:translateZ(0)}
        .brand-shell::before{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(110deg,rgba(255,255,255,.2),rgba(255,255,255,.02) 36%,transparent 60%);opacity:.45}
        .brand-shell::after{content:'';position:absolute;left:14px;right:14px;bottom:-10px;height:16px;border-radius:999px;pointer-events:none;background:radial-gradient(ellipse at center,rgba(var(--secondary-rgb),.34),transparent 72%);filter:blur(8px)}
        .brand-title{position:relative;display:inline-block;overflow:hidden}
        .brand-title::after{content:'';position:absolute;top:-18%;bottom:-18%;width:34%;left:0;pointer-events:none;background:linear-gradient(110deg,rgba(255,255,255,0),rgba(255,255,255,.5),rgba(255,255,255,0));filter:blur(1px);mix-blend-mode:screen;animation:titleSweep 9.5s ease-in-out infinite}
        .brand-gen{background:linear-gradient(135deg,#14b8a6,var(--secondary-hex));-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;position:relative}
        .topic-entry{opacity:0;animation:topicEntry .48s cubic-bezier(.2,.78,.18,1) forwards}

        @media (prefers-reduced-motion: reduce){
          .brand-title::after{animation:none;opacity:0}
          .topic-entry{animation:none;opacity:1}
        }

        .nav-3d-bar{position:relative;transform-style:preserve-3d}
        .nav-3d-bar::before{content:'';position:absolute;inset:auto 8px -14px; height:18px; border-radius:999px; background:radial-gradient(ellipse at center,rgba(var(--secondary-deep-rgb),.3),transparent 72%); filter:blur(8px); pointer-events:none}
        .tab-btn{position:relative;overflow:hidden;transition:all .28s ease;will-change:transform}
        .tab-btn::before{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(110deg,rgba(255,255,255,.22),rgba(255,255,255,0) 38%);opacity:.46;mix-blend-mode:screen}
        .tab-btn::after{content:'';position:absolute;left:10%;right:10%;bottom:-1px;height:2px;border-radius:999px;background:linear-gradient(90deg,transparent,rgba(var(--secondary-rgb),.66),transparent);opacity:0;transition:opacity .28s ease}
        .tab-btn:not(.active):hover{color:#c3cae8 !important;background:linear-gradient(140deg,rgba(255,255,255,.12),rgba(255,255,255,.03) 62%,rgba(0,0,0,.15)) !important;transform:translateY(-3px) rotateX(10deg) !important;box-shadow:0 15px 30px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.25) !important}
        .tab-btn.active{color:#edf4ff !important;text-shadow:0 0 24px rgba(var(--secondary-rgb),.7);box-shadow:inset 0 0 0 1px rgba(var(--secondary-rgb),.3),0 14px 32px rgba(var(--secondary-deep-rgb),.3),0 2px 10px rgba(20,184,166,.15) !important}
        .tab-btn.active::after{opacity:1}

        .fx-btn{transition:transform .2s ease,box-shadow .2s ease,filter .18s ease,border-color .18s ease,background .18s ease,color .18s ease}
        .fx-btn:hover{transform:translateY(-2px);filter:brightness(1.12)}

        .send-btn{box-shadow:0 4px 18px rgba(20,184,166,.35)}
        .send-btn:hover{box-shadow:0 8px 28px rgba(20,184,166,.6) !important;transform:translateY(-2px) scale(1.07) !important}

        .apply-btn{transition:transform .2s,box-shadow .2s,filter .2s}
        .apply-btn:hover{transform:translateY(-2px) scale(1.04) !important;box-shadow:0 8px 28px rgba(20,184,166,.55) !important;filter:brightness(1.1)}

        .glass-card{background:linear-gradient(135deg,rgba(255,255,255,.08),rgba(255,255,255,.025));border:1px solid rgba(255,255,255,.11);backdrop-filter:blur(20px) saturate(1.4);-webkit-backdrop-filter:blur(20px) saturate(1.4);box-shadow:0 4px 20px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.07)}

        .quote-card{background:linear-gradient(135deg,rgba(20,184,166,.1),rgba(var(--secondary-rgb),.08));border:1px solid rgba(var(--secondary-rgb),.24);border-left:3px solid rgba(20,184,166,.7);border-radius:4px 16px 16px 4px;padding:20px 24px;position:relative;overflow:hidden;box-shadow:0 6px 24px rgba(var(--secondary-deep-rgb),.09),inset 0 0 40px rgba(20,184,166,.03)}
        .quote-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,rgba(var(--secondary-rgb),.5),rgba(20,184,166,.22),transparent)}

        .hero-panel{background:linear-gradient(135deg,rgba(var(--secondary-rgb),.22),rgba(var(--secondary-rgb),.1) 42%,rgba(20,184,166,.18));border:1px solid rgba(var(--secondary-rgb),.32);box-shadow:0 14px 48px rgba(0,0,0,.32),0 0 0 1px rgba(var(--secondary-rgb),.1) inset;position:relative;overflow:hidden}
        .hero-panel::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(var(--secondary-rgb),.55),rgba(20,184,166,.32),transparent);pointer-events:none}
        .hero-panel::after{content:'';position:absolute;inset:auto -15% -60% auto;width:360px;height:360px;border-radius:50%;background:radial-gradient(circle,rgba(20,184,166,.22),transparent 70%);pointer-events:none}
        .hero-stat{font-size:10.5px;color:var(--secondary-light);background:linear-gradient(135deg,rgba(12,10,28,.5),rgba(12,10,28,.3));border:1px solid rgba(var(--secondary-rgb),.28);padding:5px 13px;border-radius:999px;letter-spacing:.3px;font-weight:600;backdrop-filter:blur(8px)}

        .trust-pill{font-size:10px;padding:4px 12px;border-radius:999px;background:linear-gradient(135deg,rgba(255,255,255,.09),rgba(255,255,255,.04));border:1px solid rgba(255,255,255,.15);color:#d0d8f0;letter-spacing:.3px;font-weight:500}

        .trust-toolbar{margin:0 0 12px}
        .trust-chip-wrap{display:flex;gap:7px;overflow:auto;padding-bottom:6px;scrollbar-width:none}
        .trust-chip{border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);color:#a6abc2;border-radius:999px;padding:6px 12px;font-size:10.5px;cursor:pointer;white-space:nowrap;transition:all .18s ease}
        .trust-chip:hover{border-color:rgba(var(--secondary-rgb),.35);color:var(--secondary-light);background:rgba(var(--secondary-rgb),.12)}
        .trust-chip.active{border-color:rgba(var(--secondary-rgb),.52);color:var(--secondary-light);background:linear-gradient(135deg,rgba(var(--secondary-rgb),.24),rgba(20,184,166,.12));box-shadow:0 4px 16px rgba(var(--secondary-deep-rgb),.22),inset 0 1px 0 rgba(255,255,255,.1)}
        .trust-search-row{display:flex;gap:8px;margin-top:8px}
        .trust-search{flex:1;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.11);border-radius:10px;padding:9px 12px;color:#e6e8f4;font-size:12px;outline:none}
        .trust-search:focus{border-color:rgba(20,184,166,.45)}
        .trust-clear{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);color:#c5c9dd;border-radius:10px;padding:8px 13px;font-size:11px;cursor:pointer;transition:all .18s ease}
        .trust-clear:hover{background:rgba(255,255,255,.11);border-color:rgba(255,255,255,.22);color:#dde1f0}
        .trust-help-box{margin:0 0 12px;background:linear-gradient(135deg,rgba(var(--secondary-rgb),.14),rgba(20,184,166,.06));border:1px solid rgba(var(--secondary-rgb),.42);border-radius:12px;padding:10px 14px;box-shadow:0 4px 16px rgba(var(--secondary-deep-rgb),.1),inset 0 1px 0 rgba(20,184,166,.12)}
        .trust-summary-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:0 0 8px}
        .trust-summary-total{font-size:10.5px;padding:3px 9px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);color:#dbe1f5}
        .trust-summary-pill{font-size:10px;padding:3px 9px;border-radius:999px;border:1px solid rgba(255,255,255,.14);color:#c8d0ea;background:rgba(255,255,255,.06)}
        .trust-summary-pill.good{border-color:rgba(16,185,129,.35);background:rgba(16,185,129,.14);color:#6ee7b7}
        .trust-summary-pill.bad{border-color:rgba(239,68,68,.35);background:rgba(239,68,68,.14);color:#fca5a5}
        .trust-summary-pill.review{border-color:rgba(250,204,21,.35);background:rgba(250,204,21,.14);color:#fde68a}
        .trust-summary-pill.report{border-color:rgba(244,63,94,.35);background:rgba(244,63,94,.14);color:#fda4af}
        .trust-summary-pill.pending{border-color:rgba(56,189,248,.35);background:rgba(56,189,248,.14);color:#7dd3fc}
        .trust-help-box p{margin:0;color:#9fd8d1;font-size:11.5px;line-height:1.55}
        .trust-help-box strong{color:#c8fff6}

        .chain-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
        .chain-card{background:linear-gradient(145deg,rgba(255,255,255,.07),rgba(255,255,255,.025));border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:14px 14px 10px;box-shadow:0 8px 32px rgba(0,0,0,.32),inset 0 1px 0 rgba(255,255,255,.07);transition:transform .22s ease,border-color .22s ease,box-shadow .22s ease;overflow:hidden}
        .chain-card:hover{transform:translateY(-3px);border-color:rgba(20,184,166,.32);box-shadow:0 16px 44px rgba(20,184,166,.13),0 0 0 1px rgba(20,184,166,.09)}
        .chain-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:-14px -14px 12px;padding:11px 14px 10px;flex-wrap:wrap;background:linear-gradient(135deg,rgba(255,255,255,.06),rgba(255,255,255,.02));border-bottom:1px solid rgba(255,255,255,.09)}
        .chain-head h3{margin:0;color:#f3f3fa;font-size:12.5px;font-weight:700;letter-spacing:-.2px;font-family:'Outfit',sans-serif}
        .verify-chip{font-size:9.5px;padding:3px 9px;border-radius:999px;background:linear-gradient(135deg,rgba(16,185,129,.18),rgba(16,185,129,.08));border:1px solid rgba(16,185,129,.4);color:#34d399;white-space:nowrap;font-weight:600;letter-spacing:.2px}
        .chain-row{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.09);border-radius:10px;padding:9px 12px;margin-bottom:7px;transition:border-color .18s ease,background .18s ease}
        .chain-row:hover{border-color:rgba(255,255,255,.16);background:rgba(255,255,255,.055)}
        .chain-row.compact{padding:8px 10px}
        .chain-row p{margin:0 0 4px;color:#a8aac0;font-size:11px;line-height:1.55}
        .chain-row p:last-child{margin-bottom:0}
        .chain-row strong{color:#eeeff8}
        .score-highlight{color:#5eead4;font-weight:700;text-shadow:0 0 10px rgba(20,184,166,.4)}
        .trust-empty{margin-top:12px;padding:12px 14px;border-radius:10px;border:1px solid rgba(20,184,166,.3);background:rgba(20,184,166,.08);color:#b6f5ec;font-size:12px}
        .payment-capture{display:grid;grid-template-columns:1fr;gap:8px;margin-top:8px;padding-top:8px;border-top:1px dashed rgba(255,255,255,.14)}
        .payment-capture label{display:grid;gap:5px;font-size:10.5px;color:#9ca4c4}
        .payment-capture input{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);border-radius:9px;padding:8px 10px;color:#e5e8f4;font-size:11.5px;outline:none}
        .payment-capture input:focus{border-color:rgba(20,184,166,.42)}
        .payment-save-btn{background:linear-gradient(135deg,#14b8a6,#2dd4bf);border:none;border-radius:9px;padding:8px 12px;color:#0d1117;font-size:11.5px;font-weight:700;cursor:pointer;justify-self:flex-start}
        .payment-save-btn:disabled{opacity:.7;cursor:not-allowed}
        .payment-recent{margin-top:4px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.09);border-radius:9px;padding:8px 10px}
        .payment-recent strong{font-size:10.5px;color:#cdd5ef}
        .payment-recent ul{margin:6px 0 0;padding-left:15px}
        .payment-recent li{color:#9fa8c7;font-size:10.5px;line-height:1.6}
        .payment-admin{margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.1)}
        .payment-admin-head{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px}
        .payment-admin-head h4{margin:0;color:#dce3fa;font-size:11.5px;font-weight:700}
        .payment-export-btn{border:1px solid rgba(var(--secondary-rgb),.46);background:rgba(var(--secondary-rgb),.14);color:var(--secondary-light);border-radius:999px;padding:5px 10px;font-size:10.5px;cursor:pointer}
        .payment-filter-tabs{display:flex;gap:7px;overflow:auto;padding-bottom:6px;scrollbar-width:none;margin-bottom:8px}
        .payment-admin-list{display:grid;grid-template-columns:1fr;gap:8px}
        .payment-admin-row{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.09);border-radius:9px;padding:9px 10px}
        .payment-admin-row p{margin:0 0 4px;color:#a8adc9;font-size:10.8px;line-height:1.55}
        .payment-admin-row p:last-child{margin-bottom:0}
        .payment-admin-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:7px}
        .payment-edit-btn,.payment-delete-btn,.payment-cancel-btn{border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.05);color:#d2d9f0;border-radius:999px;padding:4px 10px;font-size:10.5px;cursor:pointer}
        .payment-edit-btn:hover{border-color:rgba(var(--secondary-rgb),.42);background:rgba(var(--secondary-rgb),.14);color:var(--secondary-light)}
        .payment-delete-btn:hover{border-color:rgba(239,68,68,.45);background:rgba(239,68,68,.14);color:#fca5a5}
        .payment-cancel-btn:hover{border-color:rgba(148,163,184,.45);background:rgba(148,163,184,.14);color:#dbe1f3}
        .payment-edit-form{display:grid;grid-template-columns:1fr;gap:7px;margin-top:8px}
        .payment-edit-form input{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);border-radius:9px;padding:8px 10px;color:#e5e8f4;font-size:11px;outline:none}
        .payment-edit-form input:focus{border-color:rgba(var(--secondary-rgb),.5)}
        .payment-admin-msg{margin:8px 0 0;color:#93c5fd;font-size:10.8px}
        .wallet-session{border-radius:14px;padding:12px 14px;margin-bottom:10px}
        .wallet-session p{margin:0;color:#aab3d0;font-size:11px;line-height:1.55}
        .wallet-session-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px}
        .wallet-session-row input{flex:1;min-width:220px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);border-radius:9px;padding:8px 10px;color:#e5e8f4;font-size:11.5px;outline:none}
        .wallet-session-row input:focus{border-color:rgba(var(--secondary-rgb),.55)}
        .wallet-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
        .wallet-panel{border-radius:16px;padding:14px}
        .wallet-panel h3{margin:0 0 10px;color:#eef2ff;font-size:13px;font-family:'Outfit',sans-serif}
        .wallet-panel label{display:grid;gap:5px;font-size:10.8px;color:#a9b2cf;margin-bottom:8px}
        .wallet-panel input,.wallet-panel textarea,.wallet-panel select{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);border-radius:9px;padding:8px 10px;color:#e5e8f4;font-size:11.5px;outline:none}
        .wallet-panel input:focus,.wallet-panel textarea:focus,.wallet-panel select:focus{border-color:rgba(var(--secondary-rgb),.55)}
        .wallet-save-btn{background:linear-gradient(135deg,#14b8a6,var(--secondary-hex));border:none;border-radius:10px;padding:8px 12px;color:#091219;font-size:11.5px;font-weight:700;cursor:pointer}
        .wallet-msg{margin:8px 0 0;font-size:10.8px;color:#93c5fd}
        .wallet-list-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px}
        .wallet-list-head span{font-size:10.8px;color:#9ca8c8}
        .wallet-filters{display:flex;gap:7px;overflow:auto;padding-bottom:6px;scrollbar-width:none;margin-bottom:8px}
        .wallet-list{display:grid;grid-template-columns:1fr;gap:8px}
        .wallet-item{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.09);border-radius:10px;padding:9px 10px}
        .wallet-item p{margin:0 0 4px;color:#a8afca;font-size:10.8px;line-height:1.55}
        .wallet-item p:last-child{margin-bottom:0}
        .wallet-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:7px}
        .wallet-link-btn,.wallet-delete-btn{border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.05);color:#d2d9f0;border-radius:999px;padding:4px 10px;font-size:10.5px;cursor:pointer;text-decoration:none}
        .wallet-link-btn:hover{border-color:rgba(var(--secondary-rgb),.44);background:rgba(var(--secondary-rgb),.14);color:var(--secondary-light)}
        .wallet-delete-btn:hover{border-color:rgba(239,68,68,.45);background:rgba(239,68,68,.14);color:#fca5a5}
        .rating-form{display:grid;grid-template-columns:1fr;gap:8px}
        .rating-form input,.rating-form select,.rating-form textarea{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);border-radius:9px;padding:8px 10px;color:#e5e8f4;font-size:11.5px;outline:none}
        .rating-form input:focus,.rating-form select:focus,.rating-form textarea:focus{border-color:rgba(20,184,166,.4)}
        .rating-form button{background:linear-gradient(135deg,#14b8a6,#2dd4bf);border:none;border-radius:9px;padding:8px 12px;color:#131313;font-size:11.5px;font-weight:700;cursor:pointer;justify-self:flex-start}
        .rating-error{margin:0;color:#fda4af;font-size:11px}
        .inline-link{margin-left:8px;background:none;border:none;color:#7dd3fc;font-size:10.5px;cursor:pointer;padding:0}
        .verdict-wrap{margin-top:8px;padding-top:8px;border-top:1px dashed rgba(255,255,255,.14)}
        .verdict-title{margin:0 0 6px;color:#8f95ad;font-size:10.5px}
        .verdict-actions{display:flex;gap:8px;flex-wrap:wrap}
        .verdict-btn{border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.04);color:#cfd5ec;border-radius:999px;padding:4px 10px;font-size:10.5px;cursor:pointer;transition:all .18s ease}
        .verdict-btn.good:hover,.verdict-btn.good.active{border-color:rgba(16,185,129,.45);background:rgba(16,185,129,.14);color:#6ee7b7}
        .verdict-btn.bad:hover,.verdict-btn.bad.active{border-color:rgba(239,68,68,.45);background:rgba(239,68,68,.14);color:#fca5a5}
        .verdict-btn.review:hover,.verdict-btn.review.active{border-color:rgba(250,204,21,.45);background:rgba(250,204,21,.14);color:#fde68a}
        .verdict-btn.report:hover,.verdict-btn.report.active{border-color:rgba(244,63,94,.45);background:rgba(244,63,94,.14);color:#fda4af}
        .verdict-btn.pending:hover,.verdict-btn.pending.active{border-color:rgba(56,189,248,.45);background:rgba(56,189,248,.14);color:#7dd3fc}
        .verdict-note{margin:8px 0 0;font-size:10.5px;font-weight:600}
        .verdict-note.good{color:#6ee7b7}
        .verdict-note.bad{color:#fca5a5}
        .verdict-note.review{color:#fde68a}
        .verdict-note.report{color:#fda4af}
        .verdict-note.pending{color:#7dd3fc}

        .topic-card{transition:transform .25s ease,box-shadow .25s ease,background .2s,border-color .2s,color .2s !important;will-change:transform}
        .topic-card:hover{transform:translateY(-4px) scale(1.02) !important;box-shadow:0 16px 44px rgba(20,184,166,.18),0 0 0 1px rgba(20,184,166,.25) !important}

        .card-3d{transition:transform .28s ease,box-shadow .28s ease,background .22s,border-color .22s !important;will-change:transform}

        .link-card{transition:transform .25s ease,box-shadow .25s ease,border-color .22s !important;will-change:transform}
        .link-card:hover{transform:translateY(-5px) !important;box-shadow:0 18px 50px rgba(0,0,0,.45),0 0 0 1px rgba(255,255,255,.15) !important;border-color:rgba(255,255,255,.2) !important}

        .card-hover{transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease !important}
        .card-hover:hover{transform:translateY(-3px) !important;box-shadow:0 14px 42px rgba(0,0,0,.4),0 0 0 1px rgba(20,184,166,.2) !important}

        .input-shell{box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 0 0 1px rgba(var(--secondary-rgb),.18),0 16px 44px rgba(0,0,0,.5),0 0 40px rgba(var(--secondary-deep-rgb),.18)}
        .input-shell:focus-within{transform:translateY(-1px);box-shadow:0 0 0 2px rgba(var(--secondary-rgb),.55),inset 0 1px 0 rgba(255,255,255,.14),0 20px 52px rgba(0,0,0,.55),0 0 58px rgba(var(--secondary-deep-rgb),.28) !important;border-color:rgba(var(--secondary-rgb),.75) !important}

        .section-accent{display:inline-block;border-left:3px solid var(--secondary-hex);padding:3px 12px;animation:sectionIn .4s ease both;background:linear-gradient(90deg,rgba(var(--secondary-rgb),.1),rgba(20,184,166,.04) 58%,transparent 78%);border-radius:0 8px 8px 0}

        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:rgba(20,184,166,.22);border-radius:10px}
        ::-webkit-scrollbar-thumb:hover{background:rgba(20,184,166,.45)}
        ::-webkit-scrollbar-track{background:transparent}

        ::selection{background:rgba(20,184,166,.3);color:#fff}
        textarea::placeholder{color:#8ea2d9}
        input::placeholder{color:#28283a}
        select option{background:#0e0e1e;color:#e0e0ea}

        button:focus-visible{outline:2px solid rgba(20,184,166,.65);outline-offset:2px}
        a:focus-visible{outline:2px solid rgba(20,184,166,.65);outline-offset:2px}

        @media(max-width:640px){
          .orb{opacity:.05;filter:blur(60px)}
          .ambient-grid{opacity:.2;background-size:26px 26px}
          .trust-strip{display:none !important}
          .chain-grid{grid-template-columns:1fr}
          .wallet-grid{grid-template-columns:1fr}
          .trust-search-row{flex-direction:column}
          .brand-shell{padding:8px 10px !important}
          .fx-btn:hover,.card-3d:hover,.link-card:hover,.topic-card:hover,.send-btn:hover,.apply-btn:hover{transform:none !important;box-shadow:none !important;filter:none !important}
          .input-shell:focus-within{transform:none;box-shadow:0 0 0 2px rgba(var(--secondary-rgb),.38),inset 0 1px 0 rgba(255,255,255,.08),0 0 28px rgba(var(--secondary-deep-rgb),.2) !important}
        }
      `}</style>
    </div>
  );
}

