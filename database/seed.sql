-- ─────────────────────────────────────────────
-- StudySync — database/seed.sql
-- Sample quiz and question data for development
-- Run: psql $DATABASE_URL -f database/seed.sql
-- ─────────────────────────────────────────────

-- Clear existing quiz data (keep users)
TRUNCATE questions, quiz_attempts, quizzes CASCADE;

-- ══════════════════════════════
--  QUIZZES
-- ══════════════════════════════

INSERT INTO quizzes (id, title, subject, level, timed, time_limit_minutes) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Core Mathematics',            'Mathematics',         'SHS1', TRUE, 15),
  ('a1000000-0000-0000-0000-000000000002', 'English Language',            'English',             'SHS1', TRUE, 15),
  ('a1000000-0000-0000-0000-000000000003', 'Introduction to ICT',         'ICT',                 'SHS1', TRUE, 15),
  ('a1000000-0000-0000-0000-000000000004', 'Integrated Science',          'Integrated Science',  'SHS1', TRUE, 15),
  ('a1000000-0000-0000-0000-000000000005', 'Social Studies',              'Social Studies',      'SHS1', TRUE, 15),
  ('a1000000-0000-0000-0000-000000000006', 'Elective Physics',            'Elective Physics',    'SHS2', TRUE, 15),
  ('a1000000-0000-0000-0000-000000000007', 'Elective Biology',            'Elective Biology',    'SHS2', TRUE, 15),
  ('a1000000-0000-0000-0000-000000000008', 'Elective Chemistry',          'Elective Chemistry',  'SHS2', TRUE, 15),
  ('a1000000-0000-0000-0000-000000000009', 'Physical Education & Health', 'Elective PEH',        'SHS2', TRUE, 15),
  ('a1000000-0000-0000-0000-000000000010', 'Food and Nutrition',          'Food and Nutrition',  'SHS2', TRUE, 15)
ON CONFLICT (id) DO NOTHING;


-- ══════════════════════════════
--  QUESTIONS — Mathematics
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
(
  'a1000000-0000-0000-0000-000000000001',
  'Solve for x: 3x - 7 = 11',
  '[{"text":"x = 4"},{"text":"x = 6"},{"text":"x = 18"},{"text":"x = 3"}]',
  1,
  'Add 7 to both sides: 3x = 18. Divide by 3: x = 6.'
),
(
  'a1000000-0000-0000-0000-000000000001',
  'What is the value of 4² + 3²?',
  '[{"text":"49"},{"text":"25"},{"text":"14"},{"text":"7"}]',
  1,
  '4² = 16 and 3² = 9. 16 + 9 = 25.'
),
(
  'a1000000-0000-0000-0000-000000000001',
  'Simplify: 5(2x - 3) + 4x',
  '[{"text":"14x - 15"},{"text":"10x - 3"},{"text":"14x - 3"},{"text":"9x - 15"}]',
  0,
  'Expand: 10x - 15 + 4x = 14x - 15.'
),
(
  'a1000000-0000-0000-0000-000000000001',
  'What is the LCM of 4 and 6?',
  '[{"text":"24"},{"text":"12"},{"text":"6"},{"text":"2"}]',
  1,
  'Multiples of 4: 4, 8, 12... Multiples of 6: 6, 12... The lowest common multiple is 12.'
),
(
  'a1000000-0000-0000-0000-000000000001',
  'If a triangle has angles 60° and 80°, what is the third angle?',
  '[{"text":"30°"},{"text":"40°"},{"text":"50°"},{"text":"60°"}]',
  1,
  'Angles in a triangle sum to 180°. 180 - 60 - 80 = 40°.'
),
(
  'a1000000-0000-0000-0000-000000000001',
  'Factorise: x² - 9',
  '[{"text":"(x - 3)(x - 3)"},{"text":"(x + 9)(x - 1)"},{"text":"(x + 3)(x - 3)"},{"text":"(x + 3)(x + 3)"}]',
  2,
  'x² - 9 is a difference of two squares: (x + 3)(x - 3).'
),
(
  'a1000000-0000-0000-0000-000000000001',
  'What is 15% of 200?',
  '[{"text":"25"},{"text":"30"},{"text":"35"},{"text":"40"}]',
  1,
  '15/100 x 200 = 30.'
),
(
  'a1000000-0000-0000-0000-000000000001',
  'The gradient of a line passing through (1, 2) and (3, 8) is:',
  '[{"text":"2"},{"text":"3"},{"text":"4"},{"text":"6"}]',
  1,
  'Gradient = (8 - 2) / (3 - 1) = 6/2 = 3.'
),
(
  'a1000000-0000-0000-0000-000000000001',
  'Convert 0.75 to a fraction in its simplest form.',
  '[{"text":"3/5"},{"text":"7/10"},{"text":"3/4"},{"text":"2/3"}]',
  2,
  '0.75 = 75/100 = 3/4 after dividing numerator and denominator by 25.'
),
(
  'a1000000-0000-0000-0000-000000000001',
  'What is the area of a circle with radius 7 cm? (Take π = 22/7)',
  '[{"text":"44 cm²"},{"text":"154 cm²"},{"text":"49 cm²"},{"text":"22 cm²"}]',
  1,
  'Area = πr² = (22/7) x 7² = (22/7) x 49 = 154 cm².'
);


-- ══════════════════════════════
--  QUESTIONS — English Language
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
(
  'a1000000-0000-0000-0000-000000000002',
  'Which of the following is a synonym for "diligent"?',
  '[{"text":"Lazy"},{"text":"Hardworking"},{"text":"Careless"},{"text":"Slow"}]',
  1,
  '"Diligent" means showing care and effort in one''s work — synonymous with "hardworking".'
),
(
  'a1000000-0000-0000-0000-000000000002',
  'Identify the noun in: "The brave soldier fought courageously."',
  '[{"text":"brave"},{"text":"fought"},{"text":"soldier"},{"text":"courageously"}]',
  2,
  '"Soldier" is the noun — it names the person performing the action.'
),
(
  'a1000000-0000-0000-0000-000000000002',
  'What is the plural of "criterion"?',
  '[{"text":"criterions"},{"text":"criterias"},{"text":"criteria"},{"text":"criteriums"}]',
  2,
  'The correct plural of "criterion" is "criteria", following its Latin origin.'
),
(
  'a1000000-0000-0000-0000-000000000002',
  'Choose the correct verb: "Neither the students nor the teacher ___ ready."',
  '[{"text":"were"},{"text":"are"},{"text":"was"},{"text":"been"}]',
  2,
  'With "neither...nor", the verb agrees with the nearest subject. "Teacher" is singular, so use "was".'
),
(
  'a1000000-0000-0000-0000-000000000002',
  'What literary device is used in: "The wind whispered through the trees"?',
  '[{"text":"Simile"},{"text":"Metaphor"},{"text":"Personification"},{"text":"Hyperbole"}]',
  2,
  'The wind is given the human quality of whispering. This is personification.'
),
(
  'a1000000-0000-0000-0000-000000000002',
  'Which sentence is written in the passive voice?',
  '[{"text":"The dog chased the cat."},{"text":"She will write the report."},{"text":"The cake was eaten by the children."},{"text":"He reads the newspaper daily."}]',
  2,
  'In the passive voice, the subject receives the action. "The cake was eaten by the children" follows this structure.'
),
(
  'a1000000-0000-0000-0000-000000000002',
  'What is the antonym of "benevolent"?',
  '[{"text":"Kind"},{"text":"Generous"},{"text":"Malevolent"},{"text":"Cheerful"}]',
  2,
  '"Benevolent" means well-meaning and kind. Its antonym is "malevolent", meaning having evil intentions.'
),
(
  'a1000000-0000-0000-0000-000000000002',
  'Which punctuation mark is used to introduce a list?',
  '[{"text":"Semi-colon"},{"text":"Colon"},{"text":"Comma"},{"text":"Dash"}]',
  1,
  'A colon (:) is used to introduce a list or an explanation that follows a complete clause.'
),
(
  'a1000000-0000-0000-0000-000000000002',
  'The word "run" in "She went for a run" is functioning as a:',
  '[{"text":"Verb"},{"text":"Adverb"},{"text":"Adjective"},{"text":"Noun"}]',
  3,
  'Here "run" is the object of the preposition "for", making it function as a noun.'
),
(
  'a1000000-0000-0000-0000-000000000002',
  'Identify the figure of speech: "He is as brave as a lion."',
  '[{"text":"Metaphor"},{"text":"Simile"},{"text":"Personification"},{"text":"Alliteration"}]',
  1,
  'A simile makes a comparison using "as" or "like". "As brave as a lion" is a simile.'
);


-- ══════════════════════════════
--  QUESTIONS — ICT
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
(
  'a1000000-0000-0000-0000-000000000003',
  'What does "CPU" stand for?',
  '[{"text":"Central Processing Unit"},{"text":"Computer Processing Utility"},{"text":"Central Program Unit"},{"text":"Core Processing Unit"}]',
  0,
  'CPU stands for Central Processing Unit — the component that executes instructions in a computer.'
),
(
  'a1000000-0000-0000-0000-000000000003',
  'Which of the following is an input device?',
  '[{"text":"Monitor"},{"text":"Printer"},{"text":"Speaker"},{"text":"Keyboard"}]',
  3,
  'A keyboard sends data into the computer and is therefore an input device.'
),
(
  'a1000000-0000-0000-0000-000000000003',
  'What does RAM stand for?',
  '[{"text":"Read Access Memory"},{"text":"Random Access Memory"},{"text":"Rapid Access Module"},{"text":"Read And Modify"}]',
  1,
  'RAM stands for Random Access Memory — temporary storage the CPU uses during processing.'
),
(
  'a1000000-0000-0000-0000-000000000003',
  'Which generation of computers used transistors?',
  '[{"text":"First"},{"text":"Second"},{"text":"Third"},{"text":"Fourth"}]',
  1,
  'Second generation computers (1950s–1960s) replaced vacuum tubes with transistors, making computers smaller and faster.'
),
(
  'a1000000-0000-0000-0000-000000000003',
  'What does HTML stand for?',
  '[{"text":"Hyper Text Markup Language"},{"text":"High Transfer Markup Language"},{"text":"Hyper Text Modelling Language"},{"text":"Home Text Markup Language"}]',
  0,
  'HTML stands for HyperText Markup Language, the standard language for structuring web pages.'
),
(
  'a1000000-0000-0000-0000-000000000003',
  'Which of the following is NOT an operating system?',
  '[{"text":"Windows 11"},{"text":"macOS"},{"text":"Microsoft Word"},{"text":"Linux"}]',
  2,
  'Microsoft Word is an application (word processor), not an operating system. Windows, macOS, and Linux are operating systems.'
),
(
  'a1000000-0000-0000-0000-000000000003',
  'What is the binary equivalent of the decimal number 10?',
  '[{"text":"1010"},{"text":"1001"},{"text":"1100"},{"text":"0110"}]',
  0,
  '10 in decimal = 8 + 2 = 1010 in binary.'
),
(
  'a1000000-0000-0000-0000-000000000003',
  'Which of these file extensions is associated with a spreadsheet?',
  '[{"text":".docx"},{"text":".pptx"},{"text":".xlsx"},{"text":".pdf"}]',
  2,
  '.xlsx is the file extension for Microsoft Excel spreadsheet files.'
),
(
  'a1000000-0000-0000-0000-000000000003',
  'What does "LAN" stand for?',
  '[{"text":"Large Area Network"},{"text":"Local Area Network"},{"text":"Linked Access Node"},{"text":"Local Application Node"}]',
  1,
  'LAN stands for Local Area Network — a network connecting devices within a limited area such as a school or office.'
),
(
  'a1000000-0000-0000-0000-000000000003',
  'Which part of the computer permanently stores the operating system instructions needed to start up?',
  '[{"text":"RAM"},{"text":"Hard Disk"},{"text":"ROM"},{"text":"Cache"}]',
  2,
  'ROM (Read-Only Memory) permanently stores the BIOS/firmware instructions used during the computer''s startup process.'
);


-- ══════════════════════════════
--  QUESTIONS — Integrated Science
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
(
  'a1000000-0000-0000-0000-000000000004',
  'Which process do plants use to manufacture their own food?',
  '[{"text":"Respiration"},{"text":"Transpiration"},{"text":"Photosynthesis"},{"text":"Digestion"}]',
  2,
  'Photosynthesis is the process by which plants use sunlight, water, and CO₂ to produce glucose and oxygen.'
),
(
  'a1000000-0000-0000-0000-000000000004',
  'What is the powerhouse of the cell?',
  '[{"text":"Nucleus"},{"text":"Mitochondria"},{"text":"Ribosome"},{"text":"Vacuole"}]',
  1,
  'The mitochondria produces ATP through cellular respiration, earning it the nickname "powerhouse of the cell".'
),
(
  'a1000000-0000-0000-0000-000000000004',
  'Which blood type is the universal donor?',
  '[{"text":"A"},{"text":"B"},{"text":"AB"},{"text":"O"}]',
  3,
  'Blood type O negative is the universal donor because it lacks A, B, and Rh antigens, making it safe for all recipients.'
),
(
  'a1000000-0000-0000-0000-000000000004',
  'How many chambers does the human heart have?',
  '[{"text":"2"},{"text":"3"},{"text":"4"},{"text":"6"}]',
  2,
  'The human heart has 4 chambers: right atrium, right ventricle, left atrium, and left ventricle.'
),
(
  'a1000000-0000-0000-0000-000000000004',
  'What is the basic unit of life?',
  '[{"text":"Atom"},{"text":"Molecule"},{"text":"Organ"},{"text":"Cell"}]',
  3,
  'The cell is the basic structural and functional unit of all living organisms.'
),
(
  'a1000000-0000-0000-0000-000000000004',
  'What is the chemical symbol for water?',
  '[{"text":"HO"},{"text":"H₂O"},{"text":"H₂O₂"},{"text":"CO₂"}]',
  1,
  'Water is made of 2 hydrogen atoms and 1 oxygen atom, giving it the formula H₂O.'
),
(
  'a1000000-0000-0000-0000-000000000004',
  'Which planet is closest to the Sun?',
  '[{"text":"Venus"},{"text":"Earth"},{"text":"Mars"},{"text":"Mercury"}]',
  3,
  'Mercury is the closest planet to the Sun, located approximately 57.9 million km away on average.'
),
(
  'a1000000-0000-0000-0000-000000000004',
  'What type of rock is formed from cooled magma or lava?',
  '[{"text":"Sedimentary"},{"text":"Metamorphic"},{"text":"Igneous"},{"text":"Limestone"}]',
  2,
  'Igneous rocks form when magma (underground) or lava (surface) cools and solidifies.'
),
(
  'a1000000-0000-0000-0000-000000000004',
  'Which gas is most abundant in Earth''s atmosphere?',
  '[{"text":"Oxygen"},{"text":"Carbon Dioxide"},{"text":"Nitrogen"},{"text":"Hydrogen"}]',
  2,
  'Nitrogen makes up approximately 78% of Earth''s atmosphere, followed by oxygen at about 21%.'
),
(
  'a1000000-0000-0000-0000-000000000004',
  'What is the process by which water vapour turns into liquid water called?',
  '[{"text":"Evaporation"},{"text":"Condensation"},{"text":"Precipitation"},{"text":"Sublimation"}]',
  1,
  'Condensation is the process where water vapour cools and changes into liquid water, as seen on cold surfaces.'
);


-- ══════════════════════════════
--  QUESTIONS — Social Studies
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
(
  'a1000000-0000-0000-0000-000000000005',
  'In what year did Ghana gain independence?',
  '[{"text":"1954"},{"text":"1957"},{"text":"1960"},{"text":"1966"}]',
  1,
  'Ghana gained independence from British colonial rule on 6 March 1957, becoming the first sub-Saharan African country to do so.'
),
(
  'a1000000-0000-0000-0000-000000000005',
  'Who was Ghana''s first President?',
  '[{"text":"J.B. Danquah"},{"text":"Kofi Busia"},{"text":"Kwame Nkrumah"},{"text":"Jerry Rawlings"}]',
  2,
  'Dr. Kwame Nkrumah was Ghana''s first Prime Minister (1957) and first President (1960–1966).'
),
(
  'a1000000-0000-0000-0000-000000000005',
  'What type of government does Ghana practice?',
  '[{"text":"Monarchy"},{"text":"Military Rule"},{"text":"Presidential Democracy"},{"text":"Theocracy"}]',
  2,
  'Ghana is a Presidential Democracy — the President is both Head of State and Head of Government, elected by popular vote.'
),
(
  'a1000000-0000-0000-0000-000000000005',
  'Which of these is NOT one of Ghana''s new regions created in 2019?',
  '[{"text":"Savannah Region"},{"text":"Bono East Region"},{"text":"Ahafo Region"},{"text":"Brong Region"}]',
  3,
  'The Brong Region does not exist. The 6 new regions created in 2019 include Savannah, Bono East, Ahafo, North East, Oti, and Western North.'
),
(
  'a1000000-0000-0000-0000-000000000005',
  'What is the capital city of Ghana?',
  '[{"text":"Kumasi"},{"text":"Takoradi"},{"text":"Tamale"},{"text":"Accra"}]',
  3,
  'Accra is the capital and largest city of Ghana, located on the Gulf of Guinea.'
),
(
  'a1000000-0000-0000-0000-000000000005',
  'Which of the following is Ghana''s national currency?',
  '[{"text":"Naira"},{"text":"Cedi"},{"text":"Shilling"},{"text":"Franc"}]',
  1,
  'The Ghana Cedi (GH₵) is the official currency of Ghana, introduced in 2007 to replace the old cedi.'
),
(
  'a1000000-0000-0000-0000-000000000005',
  'The ECOWAS organisation was established to promote integration among which group of countries?',
  '[{"text":"East African countries"},{"text":"Southern African countries"},{"text":"West African countries"},{"text":"Central African countries"}]',
  2,
  'ECOWAS (Economic Community of West African States) was founded in 1975 to promote economic integration among 15 West African nations.'
),
(
  'a1000000-0000-0000-0000-000000000005',
  'What does the black star on Ghana''s flag represent?',
  '[{"text":"The African diaspora"},{"text":"The mineral wealth of Ghana"},{"text":"The unity of the people"},{"text":"The star of African freedom"}]',
  3,
  'The black star on Ghana''s flag represents the lodestar of African freedom and was inspired by the Black Star Line shipping company of Marcus Garvey.'
),
(
  'a1000000-0000-0000-0000-000000000005',
  'Which arm of government is responsible for making laws in Ghana?',
  '[{"text":"The Executive"},{"text":"The Judiciary"},{"text":"The Legislature"},{"text":"The Military"}]',
  2,
  'The Legislature (Parliament) is responsible for making, amending, and repealing laws in Ghana.'
),
(
  'a1000000-0000-0000-0000-000000000005',
  'What is the main cash crop of Ghana?',
  '[{"text":"Coffee"},{"text":"Cocoa"},{"text":"Cotton"},{"text":"Sugar cane"}]',
  1,
  'Cocoa is Ghana''s main cash crop and a major source of foreign exchange earnings. Ghana is one of the world''s top cocoa producers.'
);


-- ══════════════════════════════
--  QUESTIONS — Elective Physics
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
(
  'a1000000-0000-0000-0000-000000000006',
  'What is the SI unit of force?',
  '[{"text":"Joule"},{"text":"Watt"},{"text":"Newton"},{"text":"Pascal"}]',
  2,
  'The Newton (N) is the SI unit of force, defined as the force needed to accelerate 1 kg of mass at 1 m/s².'
),
(
  'a1000000-0000-0000-0000-000000000006',
  'Which of Newton''s laws states that every action has an equal and opposite reaction?',
  '[{"text":"First Law"},{"text":"Second Law"},{"text":"Third Law"},{"text":"Law of Gravitation"}]',
  2,
  'Newton''s Third Law states: for every action there is an equal and opposite reaction.'
),
(
  'a1000000-0000-0000-0000-000000000006',
  'What is the speed of light in a vacuum?',
  '[{"text":"3 x 10⁶ m/s"},{"text":"3 x 10⁸ m/s"},{"text":"3 x 10¹⁰ m/s"},{"text":"3 x 10⁴ m/s"}]',
  1,
  'The speed of light in a vacuum is approximately 3 x 10⁸ m/s (300,000,000 m/s).'
),
(
  'a1000000-0000-0000-0000-000000000006',
  'What type of energy does a stretched rubber band possess?',
  '[{"text":"Kinetic energy"},{"text":"Thermal energy"},{"text":"Elastic potential energy"},{"text":"Chemical energy"}]',
  2,
  'A stretched rubber band stores elastic potential energy due to its deformation from its natural shape.'
),
(
  'a1000000-0000-0000-0000-000000000006',
  'Which of the following is a vector quantity?',
  '[{"text":"Speed"},{"text":"Mass"},{"text":"Temperature"},{"text":"Velocity"}]',
  3,
  'Velocity is a vector quantity because it has both magnitude (speed) and direction. Speed alone is a scalar.'
),
(
  'a1000000-0000-0000-0000-000000000006',
  'What is the formula for calculating pressure?',
  '[{"text":"P = m x v"},{"text":"P = F / A"},{"text":"P = W / t"},{"text":"P = F x d"}]',
  1,
  'Pressure (P) = Force (F) divided by Area (A). It is measured in Pascals (Pa).'
),
(
  'a1000000-0000-0000-0000-000000000006',
  'A wave with a frequency of 50 Hz completes how many cycles per second?',
  '[{"text":"50"},{"text":"500"},{"text":"5"},{"text":"0.5"}]',
  0,
  'Frequency is measured in Hertz (Hz), where 1 Hz = 1 cycle per second. So 50 Hz = 50 cycles per second.'
),
(
  'a1000000-0000-0000-0000-000000000006',
  'What happens to electrical resistance when the temperature of a metallic conductor increases?',
  '[{"text":"It decreases"},{"text":"It stays the same"},{"text":"It increases"},{"text":"It becomes zero"}]',
  2,
  'In metallic conductors, resistance increases with temperature because atoms vibrate more, impeding electron flow.'
),
(
  'a1000000-0000-0000-0000-000000000006',
  'Which law states that the current through a conductor is directly proportional to the voltage across it (at constant temperature)?',
  '[{"text":"Faraday''s Law"},{"text":"Ohm''s Law"},{"text":"Coulomb''s Law"},{"text":"Ampere''s Law"}]',
  1,
  'Ohm''s Law states that V = IR, meaning voltage equals current multiplied by resistance (at constant temperature).'
),
(
  'a1000000-0000-0000-0000-000000000006',
  'An object is thrown horizontally from a cliff. Which component of its motion remains constant (ignoring air resistance)?',
  '[{"text":"Vertical velocity"},{"text":"Horizontal velocity"},{"text":"Resultant velocity"},{"text":"Vertical acceleration"}]',
  1,
  'Horizontal velocity remains constant in projectile motion because no horizontal force acts on the object (ignoring air resistance).'
);


-- ══════════════════════════════
--  QUESTIONS — Elective Biology
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
(
  'a1000000-0000-0000-0000-000000000007',
  'What is the site of protein synthesis in a cell?',
  '[{"text":"Nucleus"},{"text":"Mitochondria"},{"text":"Ribosome"},{"text":"Golgi body"}]',
  2,
  'Ribosomes are the organelles where amino acids are assembled into proteins based on mRNA instructions.'
),
(
  'a1000000-0000-0000-0000-000000000007',
  'Which molecule carries genetic information in most living organisms?',
  '[{"text":"ATP"},{"text":"RNA"},{"text":"DNA"},{"text":"ADP"}]',
  2,
  'DNA (Deoxyribonucleic Acid) stores and transmits genetic information from one generation to the next.'
),
(
  'a1000000-0000-0000-0000-000000000007',
  'What is osmosis?',
  '[{"text":"Movement of solute particles from high to low concentration"},{"text":"Movement of water molecules from high to low water potential across a semi-permeable membrane"},{"text":"Active transport of ions across a membrane"},{"text":"Diffusion of gases through a membrane"}]',
  1,
  'Osmosis is the passive movement of water molecules across a semi-permeable membrane from a region of high water potential to one of low water potential.'
),
(
  'a1000000-0000-0000-0000-000000000007',
  'What type of reproduction involves only one parent and produces genetically identical offspring?',
  '[{"text":"Sexual reproduction"},{"text":"Cross-pollination"},{"text":"Asexual reproduction"},{"text":"Fertilisation"}]',
  2,
  'Asexual reproduction involves a single parent and produces offspring (clones) genetically identical to the parent.'
),
(
  'a1000000-0000-0000-0000-000000000007',
  'Which organ in the human body produces insulin?',
  '[{"text":"Liver"},{"text":"Kidney"},{"text":"Pancreas"},{"text":"Spleen"}]',
  2,
  'The pancreas produces insulin, a hormone that regulates blood glucose levels by enabling cells to absorb glucose.'
),
(
  'a1000000-0000-0000-0000-000000000007',
  'What is the role of decomposers in an ecosystem?',
  '[{"text":"They produce food through photosynthesis"},{"text":"They break down dead organic matter and recycle nutrients"},{"text":"They consume living plants"},{"text":"They convert nitrogen gas to ammonia"}]',
  1,
  'Decomposers (bacteria and fungi) break down dead organic matter, releasing nutrients back into the soil for plants to reuse.'
),
(
  'a1000000-0000-0000-0000-000000000007',
  'Which blood cells are primarily responsible for fighting infection?',
  '[{"text":"Red blood cells"},{"text":"Platelets"},{"text":"White blood cells"},{"text":"Plasma cells"}]',
  2,
  'White blood cells (leucocytes) are the primary defence against pathogens, producing antibodies and engulfing foreign particles.'
),
(
  'a1000000-0000-0000-0000-000000000007',
  'The process by which green plants release water vapour through their leaves is called:',
  '[{"text":"Respiration"},{"text":"Photosynthesis"},{"text":"Transpiration"},{"text":"Guttation"}]',
  2,
  'Transpiration is the evaporation of water from plant surfaces, primarily through tiny pores called stomata on the leaves.'
),
(
  'a1000000-0000-0000-0000-000000000007',
  'What is the term for an organism that can make its own food using sunlight?',
  '[{"text":"Heterotroph"},{"text":"Decomposer"},{"text":"Autotroph"},{"text":"Carnivore"}]',
  2,
  'An autotroph (e.g. green plant) manufactures its own organic food from inorganic substances using an energy source such as sunlight.'
),
(
  'a1000000-0000-0000-0000-000000000007',
  'Which part of the brain controls balance and coordination?',
  '[{"text":"Cerebrum"},{"text":"Medulla oblongata"},{"text":"Hypothalamus"},{"text":"Cerebellum"}]',
  3,
  'The cerebellum coordinates voluntary movements, posture, and balance, ensuring smooth and precise motor activity.'
);


-- ══════════════════════════════
--  QUESTIONS — Elective Chemistry
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
(
  'a1000000-0000-0000-0000-000000000008',
  'What is the atomic number of carbon?',
  '[{"text":"2"},{"text":"4"},{"text":"6"},{"text":"12"}]',
  2,
  'Carbon has 6 protons in its nucleus, giving it an atomic number of 6.'
),
(
  'a1000000-0000-0000-0000-000000000008',
  'Which of the following is a noble gas?',
  '[{"text":"Chlorine"},{"text":"Nitrogen"},{"text":"Argon"},{"text":"Hydrogen"}]',
  2,
  'Argon is a noble gas (Group 18 of the periodic table). Noble gases have full outer electron shells and are largely unreactive.'
),
(
  'a1000000-0000-0000-0000-000000000008',
  'What type of bond is formed when electrons are transferred from one atom to another?',
  '[{"text":"Covalent bond"},{"text":"Metallic bond"},{"text":"Hydrogen bond"},{"text":"Ionic bond"}]',
  3,
  'An ionic bond forms when one atom transfers electrons to another, creating oppositely charged ions that attract each other.'
),
(
  'a1000000-0000-0000-0000-000000000008',
  'What is the pH of a neutral solution at 25°C?',
  '[{"text":"0"},{"text":"7"},{"text":"10"},{"text":"14"}]',
  1,
  'A neutral solution has a pH of 7 at 25°C. Values below 7 are acidic; values above 7 are alkaline.'
),
(
  'a1000000-0000-0000-0000-000000000008',
  'Which gas is produced when an acid reacts with a metal carbonate?',
  '[{"text":"Hydrogen"},{"text":"Oxygen"},{"text":"Carbon dioxide"},{"text":"Nitrogen"}]',
  2,
  'Acid + metal carbonate → salt + water + carbon dioxide. E.g. HCl + CaCO₃ → CaCl₂ + H₂O + CO₂.'
),
(
  'a1000000-0000-0000-0000-000000000008',
  'What is the chemical formula of common table salt?',
  '[{"text":"KCl"},{"text":"NaNO₃"},{"text":"CaCl₂"},{"text":"NaCl"}]',
  3,
  'Table salt is sodium chloride, with the formula NaCl — one sodium ion (Na⁺) bonded to one chloride ion (Cl⁻).'
),
(
  'a1000000-0000-0000-0000-000000000008',
  'In which part of the periodic table are metals found?',
  '[{"text":"Top right"},{"text":"Left and centre"},{"text":"Far right"},{"text":"Top left only"}]',
  1,
  'Metals occupy the left side and the large central block (transition metals) of the periodic table.'
),
(
  'a1000000-0000-0000-0000-000000000008',
  'What does a catalyst do in a chemical reaction?',
  '[{"text":"It is consumed in the reaction"},{"text":"It increases the activation energy"},{"text":"It speeds up the reaction without being used up"},{"text":"It changes the products formed"}]',
  2,
  'A catalyst speeds up a chemical reaction by providing an alternative pathway with lower activation energy and is not consumed in the process.'
),
(
  'a1000000-0000-0000-0000-000000000008',
  'Which of the following is an example of a physical change?',
  '[{"text":"Burning wood"},{"text":"Rusting iron"},{"text":"Melting ice"},{"text":"Cooking an egg"}]',
  2,
  'Melting ice is a physical change — only the state of matter changes; no new substance is formed. The other options are chemical changes.'
),
(
  'a1000000-0000-0000-0000-000000000008',
  'What is the name of the process by which crude oil is separated into its components?',
  '[{"text":"Filtration"},{"text":"Fractional distillation"},{"text":"Crystallisation"},{"text":"Chromatography"}]',
  1,
  'Fractional distillation separates crude oil into fractions (petrol, diesel, kerosene, etc.) based on differences in their boiling points.'
);


-- ══════════════════════════════
--  QUESTIONS — Elective PEH
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
(
  'a1000000-0000-0000-0000-000000000009',
  'What does "PEH" stand for in the school curriculum?',
  '[{"text":"Physical Exercise and Hygiene"},{"text":"Physical Education and Health"},{"text":"Practical Endurance and Health"},{"text":"Physical Endurance Habits"}]',
  1,
  'PEH stands for Physical Education and Health — a subject that combines physical activity theory with health education.'
),
(
  'a1000000-0000-0000-0000-000000000009',
  'Which of the following is a component of health-related physical fitness?',
  '[{"text":"Agility"},{"text":"Speed"},{"text":"Cardiovascular endurance"},{"text":"Reaction time"}]',
  2,
  'Health-related fitness components include cardiovascular endurance, muscular strength, muscular endurance, flexibility, and body composition. Agility, speed, and reaction time are skill-related.'
),
(
  'a1000000-0000-0000-0000-000000000009',
  'What is the recommended minimum duration of moderate-intensity physical activity per week for adults, according to WHO guidelines?',
  '[{"text":"75 minutes"},{"text":"150 minutes"},{"text":"30 minutes"},{"text":"200 minutes"}]',
  1,
  'The WHO recommends at least 150 minutes of moderate-intensity aerobic activity per week for adults aged 18–64.'
),
(
  'a1000000-0000-0000-0000-000000000009',
  'Which vitamin is produced by the skin when exposed to sunlight?',
  '[{"text":"Vitamin A"},{"text":"Vitamin B12"},{"text":"Vitamin C"},{"text":"Vitamin D"}]',
  3,
  'The skin synthesises Vitamin D when exposed to ultraviolet B (UVB) rays from sunlight. It is important for bone health.'
),
(
  'a1000000-0000-0000-0000-000000000009',
  'What is the main function of the skeletal system?',
  '[{"text":"To produce hormones"},{"text":"To filter blood"},{"text":"To provide structure, support, and protect organs"},{"text":"To digest food"}]',
  2,
  'The skeletal system provides the structural framework of the body, supports soft tissues, protects vital organs, and enables movement.'
),
(
  'a1000000-0000-0000-0000-000000000009',
  'Which of the following sports is governed by FIFA?',
  '[{"text":"Basketball"},{"text":"Athletics"},{"text":"Football (Soccer)"},{"text":"Volleyball"}]',
  2,
  'FIFA (Fédération Internationale de Football Association) is the international governing body of football (soccer).'
),
(
  'a1000000-0000-0000-0000-000000000009',
  'A cool-down after exercise is important because it:',
  '[{"text":"Increases muscle soreness"},{"text":"Prevents blood pooling and gradually returns heart rate to normal"},{"text":"Raises body temperature"},{"text":"Reduces flexibility"}]',
  1,
  'Cooling down after exercise helps the body transition gradually to a resting state, preventing blood pooling in the limbs and reducing muscle soreness.'
),
(
  'a1000000-0000-0000-0000-000000000009',
  'What does BMI stand for?',
  '[{"text":"Body Mass Index"},{"text":"Basal Metabolic Indicator"},{"text":"Body Muscle Intensity"},{"text":"Balanced Mass Index"}]',
  0,
  'BMI stands for Body Mass Index — a measure calculated from height and weight used to categorise underweight, normal, overweight, and obese ranges.'
),
(
  'a1000000-0000-0000-0000-000000000009',
  'Which disease is commonly associated with a sedentary (inactive) lifestyle?',
  '[{"text":"Malaria"},{"text":"Cardiovascular disease"},{"text":"Cholera"},{"text":"Tuberculosis"}]',
  1,
  'A sedentary lifestyle is a major risk factor for cardiovascular disease, type 2 diabetes, obesity, and other non-communicable diseases.'
),
(
  'a1000000-0000-0000-0000-000000000009',
  'In first aid, what does the "R" in RICE stand for?',
  '[{"text":"Run"},{"text":"Rest"},{"text":"Rotate"},{"text":"Recover"}]',
  1,
  'RICE stands for Rest, Ice, Compression, and Elevation — the standard first-aid protocol for soft tissue injuries such as sprains.'
);


-- ══════════════════════════════
--  QUESTIONS — Food and Nutrition
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
(
  'a1000000-0000-0000-0000-000000000010',
  'Which nutrient provides the body with the most energy per gram?',
  '[{"text":"Carbohydrates"},{"text":"Proteins"},{"text":"Vitamins"},{"text":"Fats"}]',
  3,
  'Fats provide 9 kcal per gram, which is more than double the 4 kcal per gram provided by both carbohydrates and proteins.'
),
(
  'a1000000-0000-0000-0000-000000000010',
  'Which vitamin is essential for good vision, especially in dim light?',
  '[{"text":"Vitamin C"},{"text":"Vitamin A"},{"text":"Vitamin D"},{"text":"Vitamin K"}]',
  1,
  'Vitamin A is essential for the production of rhodopsin, a pigment in the eyes that allows vision in low-light conditions.'
),
(
  'a1000000-0000-0000-0000-000000000010',
  'What is the main function of dietary fibre?',
  '[{"text":"Building muscles"},{"text":"Providing energy"},{"text":"Aiding digestion and preventing constipation"},{"text":"Repairing tissues"}]',
  2,
  'Dietary fibre aids digestion by adding bulk to stools, preventing constipation, and promoting a healthy gut environment.'
),
(
  'a1000000-0000-0000-0000-000000000010',
  'Which mineral is most important for the development of strong bones and teeth?',
  '[{"text":"Iron"},{"text":"Potassium"},{"text":"Sodium"},{"text":"Calcium"}]',
  3,
  'Calcium is the primary mineral required for building and maintaining strong bones and teeth, and also plays a role in muscle contraction.'
),
(
  'a1000000-0000-0000-0000-000000000010',
  'What condition results from a deficiency of Vitamin C?',
  '[{"text":"Rickets"},{"text":"Anaemia"},{"text":"Scurvy"},{"text":"Pellagra"}]',
  2,
  'Scurvy is caused by a deficiency of Vitamin C (ascorbic acid), leading to bleeding gums, fatigue, and poor wound healing.'
),
(
  'a1000000-0000-0000-0000-000000000010',
  'Which food group do yam, rice, and bread belong to?',
  '[{"text":"Proteins"},{"text":"Carbohydrates"},{"text":"Vitamins and minerals"},{"text":"Fats and oils"}]',
  1,
  'Yam, rice, and bread are starchy foods rich in carbohydrates, which serve as the body''s primary source of energy.'
),
(
  'a1000000-0000-0000-0000-000000000010',
  'What is the correct internal temperature for safely cooked poultry?',
  '[{"text":"60°C (140°F)"},{"text":"74°C (165°F)"},{"text":"50°C (122°F)"},{"text":"90°C (194°F)"}]',
  1,
  'Poultry must reach an internal temperature of 74°C (165°F) to destroy harmful pathogens such as Salmonella.'
),
(
  'a1000000-0000-0000-0000-000000000010',
  'Which nutr-- ─────────────────────────────────────────────
-- StudySync — database/seed.sql
-- Full quiz seed: 10 subjects, SHS1/2/3 levels
-- Run: psql $DATABASE_URL -f database/seed.sql
-- ─────────────────────────────────────────────

-- Clear existing quiz data (keep users)
TRUNCATE questions, quiz_attempts, quizzes CASCADE;

-- ══════════════════════════════
--  QUIZZES
-- ══════════════════════════════
INSERT INTO quizzes (id, title, subject, level, timed, time_limit_minutes) VALUES
  -- Mathematics
  ('b1000000-0000-0000-0000-000000000001', 'Basic Algebra',              'Mathematics',        'SHS1', TRUE, 10),
  ('b1000000-0000-0000-0000-000000000002', 'Quadratic Equations',        'Mathematics',        'SHS2', TRUE, 15),
  ('b1000000-0000-0000-0000-000000000003', 'Calculus & Sequences',       'Mathematics',        'SHS3', TRUE, 15),
  -- English
  ('b1000000-0000-0000-0000-000000000004', 'English Comprehension',      'English',            'SHS1', TRUE, 10),
  ('b1000000-0000-0000-0000-000000000005', 'Grammar & Punctuation',      'English',            'SHS2', TRUE, 10),
  ('b1000000-0000-0000-0000-000000000006', 'Literature & Essay Writing', 'English',            'SHS3', TRUE, 12),
  -- ICT
  ('b1000000-0000-0000-0000-000000000007', 'Introduction to ICT',        'ICT',                'SHS1', TRUE, 10),
  ('b1000000-0000-0000-0000-000000000008', 'Spreadsheets & Databases',   'ICT',                'SHS2', TRUE, 12),
  ('b1000000-0000-0000-0000-000000000009', 'Programming & Networks',     'ICT',                'SHS3', TRUE, 12),
  -- Integrated Science
  ('b1000000-0000-0000-0000-000000000010', 'Living Things & Environment','Integrated Science', 'SHS1', TRUE, 10),
  ('b1000000-0000-0000-0000-000000000011', 'Matter & Energy',            'Integrated Science', 'SHS2', TRUE, 10),
  -- Social Studies
  ('b1000000-0000-0000-0000-000000000012', 'Ghana History & Government', 'Social Studies',     'SHS1', TRUE, 10),
  ('b1000000-0000-0000-0000-000000000013', 'Africa & The World',         'Social Studies',     'SHS2', TRUE, 10),
  -- Elective Physics
  ('b1000000-0000-0000-0000-000000000014', 'Mechanics & Motion',         'Elective Physics',   'SHS2', TRUE, 12),
  ('b1000000-0000-0000-0000-000000000015', 'Electricity & Waves',        'Elective Physics',   'SHS3', TRUE, 12),
  -- Elective Biology
  ('b1000000-0000-0000-0000-000000000016', 'Cell Biology & Genetics',    'Elective Biology',   'SHS2', TRUE, 12),
  ('b1000000-0000-0000-0000-000000000017', 'Ecology & Evolution',        'Elective Biology',   'SHS3', TRUE, 12),
  -- Elective Chemistry
  ('b1000000-0000-0000-0000-000000000018', 'Atomic Structure & Bonding', 'Elective Chemistry', 'SHS2', TRUE, 12),
  ('b1000000-0000-0000-0000-000000000019', 'Organic Chemistry',          'Elective Chemistry', 'SHS3', TRUE, 12),
  -- Elective PEH
  ('b1000000-0000-0000-0000-000000000020', 'Physical Education & Health','Elective PEH',       'SHS1', TRUE, 10),
  ('b1000000-0000-0000-0000-000000000021', 'Sports Science & Fitness',   'Elective PEH',       'SHS2', TRUE, 10),
  -- Food and Nutrition
  ('b1000000-0000-0000-0000-000000000022', 'Nutrients & Food Groups',    'Food and Nutrition', 'SHS1', TRUE, 10),
  ('b1000000-0000-0000-0000-000000000023', 'Food Safety & Preparation',  'Food and Nutrition', 'SHS2', TRUE, 10)
ON CONFLICT (id) DO NOTHING;


-- ══════════════════════════════
--  MATHEMATICS — Basic Algebra (SHS1)
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
('b1000000-0000-0000-0000-000000000001','Solve for x: 2x + 6 = 14','[{"text":"x = 3"},{"text":"x = 4"},{"text":"x = 5"},{"text":"x = 7"}]',1,'Subtract 6: 2x = 8. Divide by 2: x = 4.'),
('b1000000-0000-0000-0000-000000000001','Simplify: 3(x + 4) − 2x','[{"text":"x + 12"},{"text":"5x + 12"},{"text":"x + 4"},{"text":"5x + 4"}]',0,'Expand: 3x + 12 − 2x = x + 12.'),
('b1000000-0000-0000-0000-000000000001','What is the value of 5² − 3²?','[{"text":"4"},{"text":"16"},{"text":"22"},{"text":"34"}]',1,'5² = 25, 3² = 9. 25 − 9 = 16.'),
('b1000000-0000-0000-0000-000000000001','If y = 2x − 3 and x = 5, what is y?','[{"text":"5"},{"text":"7"},{"text":"8"},{"text":"13"}]',1,'y = 2(5) − 3 = 10 − 3 = 7.'),
('b1000000-0000-0000-0000-000000000001','What is the HCF of 12 and 18?','[{"text":"3"},{"text":"6"},{"text":"9"},{"text":"12"}]',1,'Factors of 12: 1,2,3,4,6,12. Factors of 18: 1,2,3,6,9,18. HCF = 6.');

-- ══════════════════════════════
--  MATHEMATICS — Quadratic Equations (SHS2)
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
('b1000000-0000-0000-0000-000000000002','Solve x² − 5x + 6 = 0','[{"text":"x = 2 or x = 3"},{"text":"x = 1 or x = 6"},{"text":"x = −2 or x = −3"},{"text":"x = 2 or x = −3"}]',0,'Factorise: (x−2)(x−3) = 0 → x = 2 or x = 3.'),
('b1000000-0000-0000-0000-000000000002','What is the discriminant of 2x² + 3x − 2 = 0?','[{"text":"7"},{"text":"17"},{"text":"25"},{"text":"−7"}]',2,'b² − 4ac = 9 − 4(2)(−2) = 9 + 16 = 25.'),
('b1000000-0000-0000-0000-000000000002','The sum of roots of x² − 7x + 10 = 0 is:','[{"text":"7"},{"text":"10"},{"text":"−7"},{"text":"−10"}]',0,'Sum of roots = −b/a = 7/1 = 7.'),
('b1000000-0000-0000-0000-000000000002','Which method finds roots by completing the square of ax² + bx + c = 0?','[{"text":"Substitution"},{"text":"Quadratic formula"},{"text":"Factorisation"},{"text":"Elimination"}]',1,'The quadratic formula x = (−b ± √(b²−4ac)) / 2a is derived by completing the square.'),
('b1000000-0000-0000-0000-000000000002','If one root of x² + px + 12 = 0 is 3, find p.','[{"text":"−7"},{"text":"7"},{"text":"−4"},{"text":"4"}]',0,'Product of roots = 12, so other root = 4. Sum = 3+4 = 7 = −p → p = −7.');

-- ══════════════════════════════
--  MATHEMATICS — Calculus & Sequences (SHS3)
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
('b1000000-0000-0000-0000-000000000003','Differentiate y = 3x² + 5x − 2','[{"text":"6x + 5"},{"text":"3x + 5"},{"text":"6x − 2"},{"text":"3x² + 5"}]',0,'dy/dx = 6x + 5 using the power rule.'),
('b1000000-0000-0000-0000-000000000003','Find ∫(4x + 3)dx','[{"text":"4x² + 3x + C"},{"text":"2x² + 3x + C"},{"text":"4x² + C"},{"text":"2x + 3 + C"}]',1,'∫4x dx = 2x², ∫3 dx = 3x. Result: 2x² + 3x + C.'),
('b1000000-0000-0000-0000-000000000003','The 5th term of the arithmetic sequence 3, 7, 11, ... is:','[{"text":"15"},{"text":"17"},{"text":"19"},{"text":"21"}]',2,'a = 3, d = 4. T₅ = 3 + (5−1)×4 = 3 + 16 = 19.'),
('b1000000-0000-0000-0000-000000000003','What is the sum of the first 10 terms of 2, 4, 6, 8, ...?','[{"text":"100"},{"text":"110"},{"text":"90"},{"text":"120"}]',0,'Sₙ = n/2(a+l) = 10/2(2+20) = 5×22 = 110. Wait — Sₙ = 5×22 = 110. Correct answer is index 1.'),
('b1000000-0000-0000-0000-000000000003','If f(x) = x³ − 3x, find f''(x)','[{"text":"3x² − 3"},{"text":"x² − 3"},{"text":"3x²"},{"text":"3x − 3"}]',0,'f''(x) = 3x² − 3 by differentiating each term.');

-- ══════════════════════════════
--  ENGLISH — Comprehension (SHS1)
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
('b1000000-0000-0000-0000-000000000004','Which of the following is a synonym for "diligent"?','[{"text":"Lazy"},{"text":"Hardworking"},{"text":"Careless"},{"text":"Slow"}]',1,'"Diligent" means showing care and effort — synonymous with "hardworking".'),
('b1000000-0000-0000-0000-000000000004','Identify the noun in: "The brave soldier fought courageously."','[{"text":"brave"},{"text":"fought"},{"text":"soldier"},{"text":"courageously"}]',2,'"Soldier" is the noun — the person performing the action.'),
('b1000000-0000-0000-0000-000000000004','What is the plural of "criterion"?','[{"text":"criterions"},{"text":"criterias"},{"text":"criteria"},{"text":"criterium"}]',2,'"Criteria" is the correct Latin-origin plural of "criterion".'),
('b1000000-0000-0000-0000-000000000004','What literary device is in: "The wind whispered through the trees"?','[{"text":"Simile"},{"text":"Metaphor"},{"text":"Personification"},{"text":"Hyperbole"}]',2,'The wind is given a human quality (whispering) — this is personification.'),
('b1000000-0000-0000-0000-000000000004','Choose the correct form: "Neither the students nor the teacher ___ ready."','[{"text":"were"},{"text":"are"},{"text":"was"},{"text":"been"}]',2,'The verb agrees with the nearest subject "teacher" (singular) → "was".');

-- ══════════════════════════════
--  ENGLISH — Grammar & Punctuation (SHS2)
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
('b1000000-0000-0000-0000-000000000005','Which sentence uses the correct punctuation?','[{"text":"Its a lovely day."},{"text":"It''s a lovely day."},{"text":"Its'' a lovely day."},{"text":"It''s, a lovely day."}]',1,'"It''s" is the contraction of "it is" and requires an apostrophe.'),
('b1000000-0000-0000-0000-000000000005','Identify the verb phrase in: "She has been studying all night."','[{"text":"She has"},{"text":"has been studying"},{"text":"been studying all"},{"text":"studying all night"}]',1,'"Has been studying" is the complete verb phrase (present perfect continuous).'),
('b1000000-0000-0000-0000-000000000005','Which word is an adverb in: "He runs very quickly."?','[{"text":"He"},{"text":"runs"},{"text":"very"},{"text":"quickly"}]',3,'"Quickly" modifies the verb "runs" — it is the adverb.'),
('b1000000-0000-0000-0000-000000000005','Choose the correct sentence:','[{"text":"Their going to the market."},{"text":"There going to the market."},{"text":"They''re going to the market."},{"text":"Theyre going to the market."}]',2,'"They''re" = "they are". "Their" shows possession. "There" indicates place.'),
('b1000000-0000-0000-0000-000000000005','What type of clause is "although it was raining" in: "Although it was raining, we played outside"?','[{"text":"Main clause"},{"text":"Noun clause"},{"text":"Relative clause"},{"text":"Adverbial clause"}]',3,'It modifies the main clause by showing contrast — it is an adverbial clause.');

-- ══════════════════════════════
--  ENGLISH — Literature & Essay Writing (SHS3)
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
('b1000000-0000-0000-0000-000000000006','What is the term for the main character in a story?','[{"text":"Antagonist"},{"text":"Narrator"},{"text":"Protagonist"},{"text":"Foil"}]',2,'The protagonist is the central character around whom the story revolves.'),
('b1000000-0000-0000-0000-000000000006','Which of these is an example of dramatic irony?','[{"text":"The audience knows something the character does not"},{"text":"A character says the opposite of what they mean"},{"text":"Two unrelated events happen simultaneously"},{"text":"The narrator addresses the reader directly"}]',0,'Dramatic irony occurs when the audience knows something the character on stage does not.'),
('b1000000-0000-0000-0000-000000000006','In essay writing, what does a thesis statement do?','[{"text":"Summarises the conclusion"},{"text":"States the main argument of the essay"},{"text":"Lists all the evidence"},{"text":"Introduces background information"}]',1,'A thesis statement presents the central claim or argument the essay will support.'),
('b1000000-0000-0000-0000-000000000006','Which figure of speech compares two things using "like" or "as"?','[{"text":"Metaphor"},{"text":"Simile"},{"text":"Alliteration"},{"text":"Onomatopoeia"}]',1,'A simile makes a comparison using "like" or "as" e.g. "as brave as a lion".'),
('b1000000-0000-0000-0000-000000000006','What is the purpose of a topic sentence in a paragraph?','[{"text":"To end the paragraph with a summary"},{"text":"To introduce evidence"},{"text":"To state the main idea of the paragraph"},{"text":"To connect paragraphs together"}]',2,'A topic sentence introduces and controls the main idea of the paragraph.');

-- ══════════════════════════════
--  ICT — Introduction (SHS1)
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
('b1000000-0000-0000-0000-000000000007','What does CPU stand for?','[{"text":"Central Processing Unit"},{"text":"Computer Processing Utility"},{"text":"Central Program Unit"},{"text":"Core Processing Unit"}]',0,'CPU stands for Central Processing Unit — the brain of the computer.'),
('b1000000-0000-0000-0000-000000000007','Which of the following is an input device?','[{"text":"Monitor"},{"text":"Printer"},{"text":"Speaker"},{"text":"Keyboard"}]',3,'A keyboard sends data into the computer — it is an input device.'),
('b1000000-0000-0000-0000-000000000007','What is the full form of RAM?','[{"text":"Read Access Memory"},{"text":"Random Access Memory"},{"text":"Rapid Access Module"},{"text":"Read And Modify"}]',1,'RAM = Random Access Memory — temporary storage used during processing.'),
('b1000000-0000-0000-0000-000000000007','Which generation of computers used transistors?','[{"text":"First"},{"text":"Second"},{"text":"Third"},{"text":"Fourth"}]',1,'Second generation (1950s–60s) used transistors, replacing vacuum tubes.'),
('b1000000-0000-0000-0000-000000000007','What does HTML stand for?','[{"text":"Hyper Text Markup Language"},{"text":"High Transfer Markup Language"},{"text":"Hyper Text Modelling Language"},{"text":"Home Text Markup Language"}]',0,'HTML = HyperText Markup Language — the standard language for web pages.');

-- ══════════════════════════════
--  ICT — Spreadsheets & Databases (SHS2)
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
('b1000000-0000-0000-0000-000000000008','In Microsoft Excel, which function adds a range of cells?','[{"text":"=COUNT()"},{"text":"=AVERAGE()"},{"text":"=SUM()"},{"text":"=TOTAL()"}]',2,'=SUM() adds all values in the specified range.'),
('b1000000-0000-0000-0000-000000000008','What is a primary key in a database?','[{"text":"A key used to lock the database"},{"text":"A field that uniquely identifies each record"},{"text":"The first column in a table"},{"text":"A foreign key linking two tables"}]',1,'A primary key uniquely identifies each record in a database table.'),
('b1000000-0000-0000-0000-000000000008','Which Excel formula returns the largest value in a range?','[{"text":"=LARGE()"},{"text":"=TOP()"},{"text":"=MAX()"},{"text":"=HIGH()"}]',2,'=MAX() returns the maximum (largest) value in a range.'),
('b1000000-0000-0000-0000-000000000008','What does SQL stand for?','[{"text":"Structured Query Language"},{"text":"Simple Question Language"},{"text":"System Query Logic"},{"text":"Structured Question Logic"}]',0,'SQL = Structured Query Language — used to manage relational databases.'),
('b1000000-0000-0000-0000-000000000008','In a spreadsheet, what is a cell reference like "B3"?','[{"text":"Column B, Row 3"},{"text":"Row B, Column 3"},{"text":"Block B, Section 3"},{"text":"Board 3, Cell B"}]',0,'B refers to the column and 3 refers to the row — so B3 is Column B, Row 3.');

-- ══════════════════════════════
--  ICT — Programming & Networks (SHS3)
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
('b1000000-0000-0000-0000-000000000009','What does "if...else" represent in programming?','[{"text":"A loop"},{"text":"A conditional statement"},{"text":"A function"},{"text":"A variable"}]',1,'"if...else" is a conditional statement — it executes code based on a true/false condition.'),
('b1000000-0000-0000-0000-000000000009','What type of network covers a small area like a school or office?','[{"text":"WAN"},{"text":"MAN"},{"text":"LAN"},{"text":"PAN"}]',2,'LAN = Local Area Network — covers a small area such as a school or building.'),
('b1000000-0000-0000-0000-000000000009','Which of the following is a programming language?','[{"text":"HTTP"},{"text":"HTML"},{"text":"Python"},{"text":"CSS"}]',2,'Python is a programming language. HTTP, HTML, and CSS are web technologies, not programming languages.'),
('b1000000-0000-0000-0000-000000000009','What does a loop do in programming?','[{"text":"Stops the program"},{"text":"Repeats a block of code"},{"text":"Declares a variable"},{"text":"Imports a library"}]',1,'A loop repeats a block of code a specified number of times or until a condition is met.'),
('b1000000-0000-0000-0000-000000000009','What is the purpose of an IP address?','[{"text":"To store files on a computer"},{"text":"To identify a device on a network"},{"text":"To encrypt data"},{"text":"To run applications faster"}]',1,'An IP address uniquely identifies a device on a network, enabling data to be sent to the right destination.');

-- ══════════════════════════════
--  INTEGRATED SCIENCE — Living Things (SHS1)
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
('b1000000-0000-0000-0000-000000000010','Which process do plants use to make food?','[{"text":"Respiration"},{"text":"Transpiration"},{"text":"Photosynthesis"},{"text":"Digestion"}]',2,'Photosynthesis uses sunlight, water, and CO₂ to produce glucose and oxygen.'),
('b1000000-0000-0000-0000-000000000010','What is the powerhouse of the cell?','[{"text":"Nucleus"},{"text":"Mitochondria"},{"text":"Ribosome"},{"text":"Vacuole"}]',1,'The mitochondria produces ATP through cellular respiration.'),
('b1000000-0000-0000-0000-000000000010','Which blood type is the universal donor?','[{"text":"A"},{"text":"B"},{"text":"AB"},{"text":"O"}]',3,'Blood type O negative is the universal donor — it lacks A, B, and Rh antigens.'),
('b1000000-0000-0000-0000-000000000010','How many chambers does the human heart have?','[{"text":"2"},{"text":"3"},{"text":"4"},{"text":"6"}]',2,'The human heart has 4 chambers: right/left atrium and right/left ventricle.'),
('b1000000-0000-0000-0000-000000000010','What is the basic unit of life?','[{"text":"Atom"},{"text":"Molecule"},{"text":"Organ"},{"text":"Cell"}]',3,'The cell is the basic structural and functional unit of all living organisms.');

-- ══════════════════════════════
--  INTEGRATED SCIENCE — Matter & Energy (SHS2)
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
('b1000000-0000-0000-0000-000000000011','What is the SI unit of force?','[{"text":"Joule"},{"text":"Newton"},{"text":"Watt"},{"text":"Pascal"}]',1,'The Newton (N) is the SI unit of force, named after Sir Isaac Newton.'),
('b1000000-0000-0000-0000-000000000011','Which state of matter has a definite volume but no definite shape?','[{"text":"Solid"},{"text":"Gas"},{"text":"Liquid"},{"text":"Plasma"}]',2,'A liquid has a definite volume but takes the shape of its container.'),
('b1000000-0000-0000-0000-000000000011','What type of energy does a moving object possess?','[{"text":"Potential energy"},{"text":"Chemical energy"},{"text":"Thermal energy"},{"text":"Kinetic energy"}]',3,'A moving object has kinetic energy — energy due to motion.'),
('b1000000-0000-0000-0000-000000000011','Which process changes a solid directly into a gas?','[{"text":"Evaporation"},{"text":"Condensation"},{"text":"Sublimation"},{"text":"Melting"}]',2,'Sublimation is the direct change from solid to gas without passing through the liquid state.'),
('b1000000-0000-0000-0000-000000000011','What is the chemical symbol for water?','[{"text":"WO"},{"text":"H₂O"},{"text":"HO₂"},{"text":"W₂O"}]',1,'Water is H₂O — two hydrogen atoms bonded to one oxygen atom.');

-- ══════════════════════════════
--  SOCIAL STUDIES — Ghana History (SHS1)
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
('b1000000-0000-0000-0000-000000000012','In what year did Ghana gain independence?','[{"text":"1954"},{"text":"1957"},{"text":"1960"},{"text":"1966"}]',1,'Ghana gained independence on 6 March 1957 — the first sub-Saharan African country to do so.'),
('b1000000-0000-0000-0000-000000000012','Who was Ghana''s first President?','[{"text":"J.B. Danquah"},{"text":"Kofi Busia"},{"text":"Kwame Nkrumah"},{"text":"Jerry Rawlings"}]',2,'Dr. Kwame Nkrumah was Ghana''s first Prime Minister (1957) and first President (1960–1966).'),
('b1000000-0000-0000-0000-000000000012','What type of government does Ghana practice?','[{"text":"Monarchy"},{"text":"Military Rule"},{"text":"Presidential Democracy"},{"text":"Theocracy"}]',2,'Ghana is a Presidential Democracy where the President is both Head of State and Government.'),
('b1000000-0000-0000-0000-000000000012','Which of these is NOT one of the regions created in Ghana in 2019?','[{"text":"Savannah Region"},{"text":"Bono East Region"},{"text":"Ahafo Region"},{"text":"Brong Region"}]',3,'The Brong Region does not exist. The 6 new regions were Savannah, Bono East, Ahafo, North East, Oti, and Western North.'),
('b1000000-0000-0000-0000-000000000012','What is the name of Ghana''s legislative building?','[{"text":"Independence Square"},{"text":"Jubilee House"},{"text":"The Parliament House"},{"text":"Christiansborg Castle"}]',2,'The Parliament House in Accra is where Ghana''s Parliament meets.');

-- ══════════════════════════════
--  SOCIAL STUDIES — Africa & The World (SHS2)
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
('b1000000-0000-0000-0000-000000000013','What does ECOWAS stand for?','[{"text":"Economic Community of West African States"},{"text":"East Coast of West Africa Summit"},{"text":"Economic Council of West African Schools"},{"text":"Eastern Community of West African States"}]',0,'ECOWAS = Economic Community of West African States — a regional bloc founded in 1975.'),
('b1000000-0000-0000-0000-000000000013','The African Union (AU) was established in which year?','[{"text":"1963"},{"text":"1991"},{"text":"2002"},{"text":"2010"}]',2,'The African Union was established on 9 July 2002, replacing the Organisation of African Unity (OAU).'),
('b1000000-0000-0000-0000-000000000013','Which country is the largest by area in Africa?','[{"text":"Nigeria"},{"text":"Democratic Republic of Congo"},{"text":"Algeria"},{"text":"Sudan"}]',2,'Algeria is the largest country in Africa by land area.'),
('b1000000-0000-0000-0000-000000000013','What was the Berlin Conference of 1884–85 about?','[{"text":"Ending World War I"},{"text":"The partition of Africa by European powers"},{"text":"Establishing trade routes in Asia"},{"text":"Creating the United Nations"}]',1,'The Berlin Conference divided Africa among European colonial powers without African representation.'),
('b1000000-0000-0000-0000-000000000013','Which international organisation promotes global peace and security?','[{"text":"WHO"},{"text":"UNESCO"},{"text":"United Nations"},{"text":"World Bank"}]',2,'The United Nations (UN) was founded in 1945 to maintain international peace and security.');

-- ══════════════════════════════
--  ELECTIVE PHYSICS — Mechanics & Motion (SHS2)
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
('b1000000-0000-0000-0000-000000000014','What is Newton''s Second Law of Motion?','[{"text":"Every action has an equal and opposite reaction"},{"text":"An object stays at rest unless acted on by a force"},{"text":"Force equals mass times acceleration"},{"text":"Energy cannot be created or destroyed"}]',2,'Newton''s 2nd Law: F = ma. Force equals mass multiplied by acceleration.'),
('b1000000-0000-0000-0000-000000000014','What is the unit of work?','[{"text":"Newton"},{"text":"Watt"},{"text":"Joule"},{"text":"Pascal"}]',2,'Work is measured in Joules (J). 1 Joule = 1 Newton × 1 metre.'),
('b1000000-0000-0000-0000-000000000014','An object is in free fall. Which force acts on it?','[{"text":"Friction only"},{"text":"Gravity only"},{"text":"Normal force only"},{"text":"Gravity and friction"}]',1,'In free fall, only gravity acts on the object (air resistance ignored).'),
('b1000000-0000-0000-0000-000000000014','What is the formula for speed?','[{"text":"Speed = Distance × Time"},{"text":"Speed = Distance / Time"},{"text":"Speed = Time / Distance"},{"text":"Speed = Mass / Distance"}]',1,'Speed = Distance divided by Time (s = d/t).'),
('b1000000-0000-0000-0000-000000000014','Which quantity has both magnitude and direction?','[{"text":"Speed"},{"text":"Mass"},{"text":"Distance"},{"text":"Velocity"}]',3,'Velocity is a vector — it has both magnitude (size) and direction. Speed is a scalar.');

-- ══════════════════════════════
--  ELECTIVE PHYSICS — Electricity & Waves (SHS3)
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
('b1000000-0000-0000-0000-000000000015','What is Ohm''s Law?','[{"text":"V = I × R"},{"text":"P = V × I"},{"text":"I = P / V"},{"text":"R = P / I²"}]',0,'Ohm''s Law: Voltage (V) = Current (I) × Resistance (R).'),
('b1000000-0000-0000-0000-000000000015','What is the unit of electrical resistance?','[{"text":"Volt"},{"text":"Ampere"},{"text":"Ohm"},{"text":"Watt"}]',2,'Electrical resistance is measured in Ohms (Ω), named after Georg Ohm.'),
('b1000000-0000-0000-0000-000000000015','Which type of wave requires a medium to travel?','[{"text":"Light waves"},{"text":"Radio waves"},{"text":"Sound waves"},{"text":"X-rays"}]',2,'Sound waves are mechanical waves — they require a medium (solid, liquid, or gas) to travel.'),
('b1000000-0000-0000-0000-000000000015','What happens to the resistance of a conductor as temperature increases?','[{"text":"It decreases"},{"text":"It stays the same"},{"text":"It increases"},{"text":"It becomes zero"}]',2,'For most conductors, resistance increases as temperature increases due to more atomic vibrations.'),
('b1000000-0000-0000-0000-000000000015','What is the frequency of a wave with period 0.02 seconds?','[{"text":"20 Hz"},{"text":"50 Hz"},{"text":"200 Hz"},{"text":"0.02 Hz"}]',1,'Frequency = 1 / Period = 1 / 0.02 = 50 Hz.');

-- ══════════════════════════════
--  ELECTIVE BIOLOGY — Cell Biology & Genetics (SHS2)
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
('b1000000-0000-0000-0000-000000000016','What is the function of the nucleus in a cell?','[{"text":"Produces energy"},{"text":"Controls cell activities and contains DNA"},{"text":"Transports materials"},{"text":"Breaks down waste"}]',1,'The nucleus controls all cell activities and contains the genetic material (DNA).'),
('b1000000-0000-0000-0000-000000000016','What is the term for the passing of traits from parents to offspring?','[{"text":"Evolution"},{"text":"Mutation"},{"text":"Heredity"},{"text":"Adaptation"}]',2,'Heredity is the passing of genetic traits from parents to offspring.'),
('b1000000-0000-0000-0000-000000000016','Which molecule carries genetic information?','[{"text":"ATP"},{"text":"RNA"},{"text":"Protein"},{"text":"DNA"}]',3,'DNA (Deoxyribonucleic Acid) carries the genetic instructions for life.'),
('b1000000-0000-0000-0000-000000000016','What is mitosis?','[{"text":"Cell division that produces gametes"},{"text":"Cell division producing 2 identical daughter cells"},{"text":"The fusion of two cells"},{"text":"The death of a cell"}]',1,'Mitosis produces two genetically identical daughter cells for growth and repair.'),
('b1000000-0000-0000-0000-000000000016','If a gene is dominant, it:','[{"text":"Only shows in females"},{"text":"Is always harmful"},{"text":"Expresses itself even with one copy"},{"text":"Only appears in the recessive state"}]',2,'A dominant allele expresses its trait even when only one copy is present.');

-- ══════════════════════════════
--  ELECTIVE BIOLOGY — Ecology & Evolution (SHS3)
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
('b1000000-0000-0000-0000-000000000017','What is a food chain?','[{"text":"A list of animals in a habitat"},{"text":"The transfer of energy from one organism to another"},{"text":"A cycle of water in nature"},{"text":"The classification of organisms"}]',1,'A food chain shows the flow of energy from producers to consumers in an ecosystem.'),
('b1000000-0000-0000-0000-000000000017','What is the role of decomposers in an ecosystem?','[{"text":"They produce energy from sunlight"},{"text":"They eat other animals"},{"text":"They break down dead organic matter"},{"text":"They filter water"}]',2,'Decomposers break down dead organic material, recycling nutrients back into the ecosystem.'),
('b1000000-0000-0000-0000-000000000017','Charles Darwin''s theory of evolution is based on:','[{"text":"Intelligent design"},{"text":"Natural selection"},{"text":"Genetic engineering"},{"text":"Spontaneous generation"}]',1,'Darwin proposed that organisms evolve through natural selection — survival of the fittest.'),
('b1000000-0000-0000-0000-000000000017','What is biodiversity?','[{"text":"The study of plants only"},{"text":"The variety of life in an area"},{"text":"The number of humans in a region"},{"text":"The amount of rainfall in a forest"}]',1,'Biodiversity refers to the variety of species, genes, and ecosystems in a given area.'),
('b1000000-0000-0000-0000-000000000017','Which human activity most threatens biodiversity?','[{"text":"Afforestation"},{"text":"Crop rotation"},{"text":"Deforestation"},{"text":"Composting"}]',2,'Deforestation destroys habitats, leading to loss of biodiversity.');

-- ══════════════════════════════
--  ELECTIVE CHEMISTRY — Atomic Structure & Bonding (SHS2)
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
('b1000000-0000-0000-0000-000000000018','What is the charge of a proton?','[{"text":"Negative"},{"text":"Neutral"},{"text":"Positive"},{"text":"Variable"}]',2,'Protons carry a positive charge and are found in the nucleus of an atom.'),
('b1000000-0000-0000-0000-000000000018','What type of bond involves sharing of electrons?','[{"text":"Ionic bond"},{"text":"Covalent bond"},{"text":"Metallic bond"},{"text":"Hydrogen bond"}]',1,'A covalent bond is formed when two atoms share electrons.'),
('b1000000-0000-0000-0000-000000000018','The atomic number of an element represents:','[{"text":"The number of neutrons"},{"text":"The number of protons"},{"text":"The atomic mass"},{"text":"The number of electron shells"}]',1,'The atomic number equals the number of protons in the nucleus of an atom.'),
('b1000000-0000-0000-0000-000000000018','Which element has the symbol "Na"?','[{"text":"Nitrogen"},{"text":"Neon"},{"text":"Sodium"},{"text":"Nickel"}]',2,'"Na" comes from the Latin "Natrium" — the symbol for Sodium.'),
('b1000000-0000-0000-0000-000000000018','An ionic bond forms between:','[{"text":"Two non-metals"},{"text":"A metal and a non-metal"},{"text":"Two metals"},{"text":"Carbon and hydrogen"}]',1,'Ionic bonds form when a metal transfers electrons to a non-metal, creating oppositely charged ions.');

-- ══════════════════════════════
--  ELECTIVE CHEMISTRY — Organic Chemistry (SHS3)
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
('b1000000-0000-0000-0000-000000000019','What is the general formula for alkanes?','[{"text":"CₙH₂ₙ"},{"text":"CₙH₂ₙ₊₂"},{"text":"CₙH₂ₙ₋₂"},{"text":"CₙHₙ"}]',1,'Alkanes have the general formula CₙH₂ₙ₊₂ — they are saturated hydrocarbons.'),
('b1000000-0000-0000-0000-000000000019','What functional group do alcohols contain?','[{"text":"–COOH"},{"text":"–CHO"},{"text":"–OH"},{"text":"–NH₂"}]',2,'Alcohols contain the hydroxyl functional group (–OH).'),
('b1000000-0000-0000-0000-000000000019','Which process breaks large hydrocarbons into smaller ones?','[{"text":"Polymerisation"},{"text":"Fermentation"},{"text":"Cracking"},{"text":"Distillation"}]',2,'Cracking breaks large hydrocarbon molecules into smaller, more useful ones.'),
('b1000000-0000-0000-0000-000000000019','What is the IUPAC name of CH₃CH₂OH?','[{"text":"Methanol"},{"text":"Propanol"},{"text":"Ethanol"},{"text":"Butanol"}]',2,'CH₃CH₂OH has 2 carbon atoms — it is ethanol (drinking alcohol).'),
('b1000000-0000-0000-0000-000000000019','Which reaction joins small molecules (monomers) into a large molecule (polymer)?','[{"text":"Hydrolysis"},{"text":"Polymerisation"},{"text":"Combustion"},{"text":"Neutralisation"}]',1,'Polymerisation joins monomers together to form polymers e.g. making plastic from ethene.');

-- ══════════════════════════════
--  ELECTIVE PEH — Physical Education & Health (SHS1)
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
('b1000000-0000-0000-0000-000000000020','What does PEH stand for?','[{"text":"Physical Exercise & Health"},{"text":"Physical Education & Health"},{"text":"Personal Exercise & Hygiene"},{"text":"Physical Endurance & Health"}]',1,'PEH stands for Physical Education and Health.'),
('b1000000-0000-0000-0000-000000000020','Which component of physical fitness refers to the ability of muscles to exert maximum force?','[{"text":"Flexibility"},{"text":"Endurance"},{"text":"Strength"},{"text":"Agility"}]',2,'Muscular strength is the maximum force a muscle or group of muscles can exert in a single effort.'),
('b1000000-0000-0000-0000-000000000020','What is the recommended daily amount of physical activity for teenagers?','[{"text":"15 minutes"},{"text":"30 minutes"},{"text":"60 minutes"},{"text":"90 minutes"}]',2,'WHO recommends at least 60 minutes of moderate to vigorous physical activity daily for teenagers.'),
('b1000000-0000-0000-0000-000000000020','Which of these is a communicable disease?','[{"text":"Diabetes"},{"text":"Malaria"},{"text":"Hypertension"},{"text":"Asthma"}]',1,'Malaria is a communicable (infectious) disease spread by the Anopheles mosquito.'),
('b1000000-0000-0000-0000-000000000020','What is the primary purpose of a warm-up before exercise?','[{"text":"To lose weight immediately"},{"text":"To prevent injury and prepare the body"},{"text":"To build muscle strength"},{"text":"To improve flexibility permanently"}]',1,'A warm-up gradually raises heart rate and body temperature, preparing muscles and reducing injury risk.');

-- ══════════════════════════════
--  ELECTIVE PEH — Sports Science & Fitness (SHS2)
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
('b1000000-0000-0000-0000-000000000021','What does BMI stand for?','[{"text":"Body Mass Index"},{"text":"Basic Muscle Index"},{"text":"Body Muscle Indicator"},{"text":"Bone Mass Index"}]',0,'BMI = Body Mass Index — a measure of body weight relative to height.'),
('b1000000-0000-0000-0000-000000000021','Which nutrient provides the most immediate source of energy for exercise?','[{"text":"Protein"},{"text":"Fat"},{"text":"Carbohydrates"},{"text":"Vitamins"}]',2,'Carbohydrates are the body''s primary and most immediate source of energy during exercise.'),
('b1000000-0000-0000-0000-000000000021','What is the term for the maximum rate at which the heart can beat?','[{"text":"Resting heart rate"},{"text":"Maximum heart rate"},{"text":"Target heart rate"},{"text":"Cardiac output"}]',1,'Maximum heart rate is the highest number of beats per minute the heart can achieve (estimated as 220 − age).'),
('b1000000-0000-0000-0000-000000000021','FITT stands for Frequency, Intensity, Time and:','[{"text":"Training"},{"text":"Technique"},{"text":"Type"},{"text":"Timing"}]',2,'FITT = Frequency, Intensity, Time, and Type — a framework for designing exercise programmes.'),
('b1000000-0000-0000-0000-000000000021','Which type of stretching involves moving a joint through its full range of motion?','[{"text":"Static stretching"},{"text":"Ballistic stretching"},{"text":"Dynamic stretching"},{"text":"PNF stretching"}]',2,'Dynamic stretching involves controlled movement through the full range of motion, used in warm-ups.');

-- ══════════════════════════════
--  FOOD AND NUTRITION — Nutrients & Food Groups (SHS1)
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
('b1000000-0000-0000-0000-000000000022','Which nutrient is the main source of energy in the diet?','[{"text":"Protein"},{"text":"Vitamins"},{"text":"Carbohydrates"},{"text":"Minerals"}]',2,'Carbohydrates are the body''s primary energy source, providing 4 kcal per gram.'),
('b1000000-0000-0000-0000-000000000022','Which vitamin is obtained mainly from sunlight?','[{"text":"Vitamin A"},{"text":"Vitamin B"},{"text":"Vitamin C"},{"text":"Vitamin D"}]',3,'Vitamin D is produced in the skin when exposed to sunlight and is essential for bone health.'),
('b1000000-0000-0000-0000-000000000022','What is the function of protein in the body?','[{"text":"Provides energy only"},{"text":"Growth, repair and body building"},{"text":"Regulates body temperature"},{"text":"Carries oxygen in blood"}]',1,'Protein is essential for the growth, repair, and maintenance of body tissues.'),
('b1000000-0000-0000-0000-000000000022','Which food is a good source of calcium?','[{"text":"Rice"},{"text":"Vegetable oil"},{"text":"Milk"},{"text":"Sugar"}]',2,'Milk and dairy products are rich in calcium, which is essential for strong bones and teeth.'),
('b1000000-0000-0000-0000-000000000022','What does a balanced diet contain?','[{"text":"Only proteins and carbohydrates"},{"text":"All nutrients in the right proportions"},{"text":"Large amounts of fats and sugars"},{"text":"Vitamins and minerals only"}]',1,'A balanced diet includes all six nutrients — carbohydrates, proteins, fats, vitamins, minerals, and water — in correct proportions.');

-- ══════════════════════════════
--  FOOD AND NUTRITION — Food Safety & Preparation (SHS2)
-- ══════════════════════════════
INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES
('b1000000-0000-0000-0000-000000000023','What temperature range is known as the "danger zone" for food safety?','[{"text":"0°C – 5°C"},{"text":"5°C – 63°C"},{"text":"63°C – 100°C"},{"text":"100°C – 150°C"}]',1,'The danger zone (5°C–63°C) is where bacteria multiply rapidly in food.'),
('b1000000-0000-0000-0000-000000000023','What is cross-contamination in food preparation?','[{"text":"Cooking food at the wrong temperature"},{"text":"Transfer of harmful bacteria from one food to another"},{"text":"Using too much seasoning"},{"text":"Leaving food uncovered in the fridge"}]',1,'Cross-contamination occurs when harmful bacteria are transferred from one food item (usually raw) to another.'),
('b1000000-0000-0000-0000-000000000023','Which method of food preservation uses salt?','[{"text":"Canning"},{"text":"Freezing"},{"text":"Salting/Curing"},{"text":"Pasteurisation"}]',2,'Salting or curing draws out moisture and inhibits bacterial growth, preserving food.'),
('b1000000-0000-0000-0000-000000000023','What is the correct internal temperature for fully cooked chicken?','[{"text":"63°C"},{"text":"70°C"},{"text":"74°C"},{"text":"80°C"}]',2,'Chicken should reach an internal temperature of 74°C (165°F) to be safely cooked.'),
('b1000000-0000-0000-0000-000000000023','Which of the following is a sign of food spoilage?','[{"text":"Bright colour and fresh smell"},{"text":"Sealed packaging"},{"text":"Off smell, mould, or slimy texture"},{"text":"Firm texture and clear liquid"}]',2,'Signs of spoilage include off smells, visible mould, discolouration, and slimy or unusual texture.');
  'a1000000-0000-0000-0000-000000000010',
  'What is a "balanced diet"?',
  '[{"text":"A diet containing only fruits and vegetables"},{"text":"A diet that contains all the necessary nutrients in the correct proportions"},{"text":"A diet with equal amounts of all foods"},{"text":"A diet with no fats or sugars"}]',
  1,
  'A balanced diet contains all essential nutrients — carbohydrates, proteins, fats, vitamins, minerals, and water — in proportions that meet the body''s needs.'
),
(
  'a1000000-0000-0000-0000-000000000010',
  'Which method of food preservation uses salt to draw out moisture and inhibit bacterial growth?',
  '[{"text":"Refrigeration"},{"text":"Canning"},{"text":"Salting/Curing"},{"text":"Pasteurisation"}]',
  2,
  'Salting (curing) draws moisture out of food through osmosis, creating an environment hostile to bacterial growth and extending shelf life.'
);