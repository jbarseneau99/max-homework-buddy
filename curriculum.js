// Ontario Grade 5 curriculum map for Max's Homework Buddy.
// Source: Ontario Ministry of Education, Curriculum and Resources (https://www.dcp.edu.gov.on.ca/en/curriculum),
// read from its public content API on 2026-11-13. Codes are the official expectation codes; the "say" text is a short,
// kid-friendly paraphrase (not the official wording). Only codes that appear in the ministry data are listed.
// status: "tested" = covered in class and tested · "lessons" = has lessons in this app · "soon" = coming up
// link: [subject id, subtopic id] in TOPICS (topics.js) — opens that part of the app.
window.CURRICULUM = {
  grade: 5, province: "Ontario", checked: "2026-11-13",
  home: "https://www.dcp.edu.gov.on.ca/en/curriculum",
  subjects: [
    { id: "math", title: "Mathematics", year: "2020", app: "math",
      source: "https://www.dcp.edu.gov.on.ca/en/curriculum/elementary-mathematics/grades/g5-math",
      strands: [
        { code: "A", title: "Social-Emotional Learning (SEL) Skills and the Math Processes", items: [
          { code: "A1", say: "Use feelings, confidence and stick-with-it skills while you problem-solve, reason and explain your math.", status: "lessons", note: "Practised in every quiz: show your work, try again." } ] },
        { code: "B", title: "Number", items: [
          { code: "B1.1", say: "Read, show, build and break apart whole numbers up to 100 000.", status: "soon" },
          { code: "B1.2", say: "Compare and order whole numbers up to 100 000.", status: "soon" },
          { code: "B1.3", say: "Show equivalent fractions from halves to twelfths, including improper fractions and mixed numbers.", status: "tested", link: ["math", "fractions"], note: "Fractions Unit 3 (3.1 and 3.2)." },
          { code: "B1.4", say: "Compare and order fractions from halves to twelfths, including improper fractions and mixed numbers.", status: "tested", link: ["math", "fractions"], note: "Fractions Unit 3 (3.3)." },
          { code: "B1.5", say: "Read, show, compare and order decimals to hundredths.", status: "soon" },
          { code: "B1.6", say: "Round decimals to the nearest tenth.", status: "soon" },
          { code: "B1.7", say: "Connect fractions, decimals (to hundredths) and whole-number percents.", status: "soon" },
          { code: "B2.1", say: "Use the properties of operations to solve problems with whole numbers and decimals.", status: "lessons", link: ["math", "multiplication"], note: "Breaking numbers apart, checking answers." },
          { code: "B2.2", say: "Know multiplication facts from 0 × 0 to 12 × 12, and the matching division facts.", status: "lessons", link: ["math", "multiplication"], note: "× Mastery tracking." },
          { code: "B2.3", say: "Mental math: multiply by 0.1 and 0.01, and estimate decimal sums and differences.", status: "soon" },
          { code: "B2.4", say: "Add and subtract whole numbers (to 100 000) and decimals (to hundredths).", status: "soon" },
          { code: "B2.5", say: "Add and subtract fractions with like denominators.", status: "tested", link: ["math", "fractions"], note: "Fractions Unit 4." },
          { code: "B2.6", say: "Multiply two-digit by two-digit numbers with the area model and algorithms.", status: "lessons", link: ["math", "multiplication"], note: "Area model, lattice, line up place values." },
          { code: "B2.7", say: "Divide three-digit by two-digit numbers with the area model and algorithms, including remainders.", status: "lessons", link: ["math", "division"], note: "Long division with remainders." },
          { code: "B2.8", say: "Multiply and divide one-digit whole numbers by unit fractions.", status: "tested", link: ["math", "fractions"], note: "Fractions Unit 4." },
          { code: "B2.9", say: "Make equivalent ratios and rates.", status: "soon" } ] },
        { code: "C", title: "Algebra", items: [
          { code: "C1", say: "Patterns: repeating, growing and shrinking patterns, pattern rules, tables of values and graphs.", status: "soon" },
          { code: "C2", say: "Variables, expressions, equations (to 100) and inequalities (to 50).", status: "soon" },
          { code: "C3", say: "Coding: write, read and change code with conditions and other control structures.", status: "soon" },
          { code: "C4", say: "Mathematical modelling of real-life situations.", status: "soon" } ] },
        { code: "D", title: "Data", items: [
          { code: "D1", say: "Data literacy: sampling, relative-frequency tables, stacked-bar graphs, infographics, mean, median and mode.", status: "soon" },
          { code: "D2", say: "Probability: use fractions on a probability line; theoretical vs experimental probability.", status: "soon" } ] },
        { code: "E", title: "Spatial Sense", items: [
          { code: "E1", say: "Triangles, congruent shapes, views of objects, coordinates and transformations on a grid.", status: "soon" },
          { code: "E2", say: "Metric units and conversions, measuring angles with a protractor, area of parallelograms and triangles.", status: "soon" } ] },
        { code: "F", title: "Financial Literacy", items: [
          { code: "F1", say: "Money: transactions with sales tax, budgets, credit and debt, unit rates, and taxes collected by each level of government.", status: "soon" } ] } ] },

    { id: "science", title: "Science and Technology", year: "2022", app: "science",
      source: "https://www.dcp.edu.gov.on.ca/en/curriculum/science-technology/grades/grade-5",
      strands: [
        { code: "A", title: "STEM Skills and Connections", items: [
          { code: "A1", say: "Investigate like a scientist or engineer: research, experiment, design, stay safe and share findings.", status: "soon" },
          { code: "A2", say: "Use coding in investigations; think about coding and new technology in everyday life.", status: "soon" },
          { code: "A3", say: "How science and technology are used in jobs (including skilled trades) and contributions from many communities.", status: "soon" } ] },
        { code: "B", title: "Life Systems: Human Health and Body Systems", items: [
          { code: "B1.1", say: "How things around us (social and environmental) affect our health, and how to lower harm.", status: "soon" },
          { code: "B1.2", say: "Good and bad effects of technologies on health and body systems.", status: "soon" },
          { code: "B1.3", say: "How food literacy helps with choices for physical and mental health.", status: "soon" },
          { code: "B2.1", say: "Name the systems of the human body and what each one does.", status: "tested", link: ["science", "anatomy"], note: "7 body systems + Max's test topics." },
          { code: "B2.2", say: "The structure and job of vital organs in each system.", status: "tested", link: ["science", "anatomy"], note: "Organs walkthrough." },
          { code: "B2.3", say: "How body systems work together.", status: "tested", link: ["science", "anatomy"], note: "All Systems view with live flow." },
          { code: "B2.4", say: "Diseases and disorders and which organs or systems they affect.", status: "soon" } ] },
        { code: "C", title: "Matter and Energy: Properties of and Changes in Matter", items: [
          { code: "C1", say: "How making everyday products affects society and the environment.", status: "soon" },
          { code: "C2", say: "Matter has mass and takes up space; solids, liquids and gases; changes of state; physical vs chemical change.", status: "soon" } ] },
        { code: "D", title: "Structures and Mechanisms: Forces Acting on Structures", items: [
          { code: "D1", say: "How forces from nature affect structures, and how people protect against them.", status: "soon" },
          { code: "D2", say: "Internal and external forces on structures; how animals, plants and safety gear protect against forces.", status: "soon" } ] },
        { code: "E", title: "Earth and Space Systems: Conservation of Energy and Resources", items: [
          { code: "E1", say: "Effects of using energy and resources (including climate change), and ways to conserve them.", status: "soon" },
          { code: "E2", say: "Forms of energy, conservation of energy, renewable vs non-renewable sources, and fossil fuels.", status: "soon" } ] } ] },

    { id: "social", title: "Social Studies", year: "2018", app: "social",
      source: "https://www.dcp.edu.gov.on.ca/en/curriculum/elementary-sshg/grades/g5-ss",
      strands: [
        { code: "A", title: "Heritage and Identity: Interactions of Indigenous Peoples and Europeans before 1713", items: [
          { code: "A1", say: "Good and bad results of contact between Indigenous peoples and European explorers and settlers.", status: "soon" },
          { code: "A2.3", say: "Read and make maps while you investigate.", status: "lessons", link: ["social", "maps"], note: "Maps & Globes." },
          { code: "A3.1", say: "Name major Indigenous nations that met European settlers or explorers before 1713.", status: "lessons", link: ["social", "indigenous"], note: "First Nations, Inuit and Métis." },
          { code: "A3.3", say: "Why Europeans explored and set up colonies.", status: "lessons", link: ["social", "history"], note: "New France and the fur trade." },
          { code: "A3.4", say: "Important offices and institutions in New France.", status: "soon" },
          { code: "A3.6", say: "How the Métis people came to be.", status: "soon" } ] },
        { code: "B", title: "People and Environments: The Role of Government and Responsible Citizenship", items: [
          { code: "B1", say: "Judge how governments (including Indigenous governments) and citizens deal with social and environmental issues, and make a plan of action.", status: "soon" },
          { code: "B2.6", say: "Explain your findings using words like government, local, municipal, provincial/territorial and federal.", status: "tested", link: ["social", "government"], note: "Government in Canada test review." },
          { code: "B3.1", say: "Rights and responsibilities of citizens in Canada.", status: "soon" },
          { code: "B3.2", say: "What each level of government is in charge of: federal, provincial/territorial and municipal.", status: "tested", link: ["social", "government"], note: "Mayor, council vote, schools are provincial." },
          { code: "B3.3", say: "First Nations, Métis and Inuit governance structures today.", status: "soon" },
          { code: "B3.4", say: "Services that levels of government share.", status: "soon" },
          { code: "B3.5", say: "How governments get input from the public (elections, town hall meetings).", status: "soon" },
          { code: "B3.9", say: "Ways citizens can take action on issues.", status: "soon" } ] } ] },

    { id: "language", title: "Language", year: "2023", app: "language",
      source: "https://www.dcp.edu.gov.on.ca/en/curriculum/elementary-language/grades/grade-5",
      strands: [
        { code: "A", title: "Literacy Connections and Applications", items: [
          { code: "A1", say: "Transferable skills (like critical thinking and communication) in reading and writing.", status: "soon" },
          { code: "A2", say: "Digital media literacy: staying safe online and checking if information is reliable.", status: "soon" },
          { code: "A3", say: "Use language skills across subjects; learn from diverse and First Nations, Métis and Inuit voices.", status: "soon" } ] },
        { code: "B", title: "Foundations of Language", items: [
          { code: "B1", say: "Listening, speaking and body language.", status: "soon" },
          { code: "B2.1", say: "Spell and read words using word parts like prefixes (pre-) and roots.", status: "lessons", link: ["language", "spelling"], note: "Weekly spelling lists + Word Work." },
          { code: "B2.2", say: "Learn and use new vocabulary.", status: "lessons", link: ["language", "spelling"], note: "Meanings, examples and fun facts." },
          { code: "B2.3", say: "Read fluently with accuracy, good pace and expression.", status: "soon" },
          { code: "B3.1", say: "Build different kinds of sentences, including compound-complex ones.", status: "soon" },
          { code: "B3.2", say: "Grammar: parts of speech in sentences.", status: "soon" },
          { code: "B3.3", say: "Capital letters and punctuation.", status: "soon" } ] },
        { code: "C", title: "Comprehension: Understanding and Responding to Texts", items: [
          { code: "C1", say: "Know about texts: forms, genres, text features, visuals, style and point of view.", status: "soon" },
          { code: "C2", say: "Reading strategies before, during and after: predict, check, connect and summarize.", status: "soon" },
          { code: "C3", say: "Think critically: literary devices, inferences and perspectives in texts.", status: "soon" } ] },
        { code: "D", title: "Composition: Expressing Ideas and Creating Texts", items: [
          { code: "D1", say: "Plan your writing: purpose, audience, ideas, research and organizing.", status: "soon" },
          { code: "D2", say: "Draft, revise, edit and proofread; write in cursive and start keyboarding.", status: "soon", note: "Sentence answers in quizzes practise complete sentences." },
          { code: "D3", say: "Publish and present your final texts, and reflect.", status: "soon" } ] } ] },

    { id: "hpe", title: "Health and Physical Education", year: "2019", app: null, brief: true,
      source: "https://www.dcp.edu.gov.on.ca/en/curriculum/elementary-health-and-physical-education/grades/grade-5",
      strands: [
        { code: "A", title: "Social-Emotional Learning Skills", items: [
          { code: "A1", say: "Manage emotions and stress, keep going, build healthy relationships, and think critically and creatively.", status: "soon" } ] },
        { code: "B", title: "Active Living", items: [
          { code: "B1", say: "Join in lots of physical activities and know what makes being active fun.", status: "soon" },
          { code: "B2", say: "Daily physical activity and health-related fitness plans.", status: "soon" },
          { code: "B3", say: "Stay safe during activity, including lowering the risk of concussion.", status: "soon" } ] },
        { code: "C", title: "Movement Competence: Skills, Concepts, and Strategies", items: [
          { code: "C1", say: "Balance, jumping, moving, and sending and receiving objects.", status: "soon" },
          { code: "C2", say: "Game strategies for different kinds of activities.", status: "soon" } ] },
        { code: "D", title: "Healthy Living", items: [
          { code: "D1", say: "Trusted people for safety, effects of alcohol, and the reproductive system and puberty.", status: "soon" },
          { code: "D2", say: "Healthy choices: nutrition facts tables and food labels, personal safety, refusal skills, helping others with mental health.", status: "soon" },
          { code: "D3", say: "How advertising affects food choices, online actions affect others, and attitudes about mental health.", status: "soon" } ] } ] }
  ]
};
