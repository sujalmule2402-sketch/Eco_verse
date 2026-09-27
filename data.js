// EcoVerse Static and Seed Data

const initialPlants = [
  {
    id: "neem",
    name: "Neem Tree",
    scientificName: "Azadirachta indica",
    oxygenProduction: "Very High (produces oxygen even at night due to CAM pathway)",
    carbonAbsorbed: "Approximately 20-25 kg CO2 per year",
    fruitsFlowers: "Small, white fragrant flowers; green drupe fruits turning yellow when ripe",
    medicinalUses: "Anti-bacterial, anti-fungal, blood purifier, heals skin diseases.",
    leavesUses: "Used for pest control, dandruff treatment, and treating skin infections.",
    rootsBarkUses: "Used to treat malaria, stomach ulcers, and skin problems; bark acts as an astringent.",
    diseasesHelped: "Eczema, acne, malaria, diabetes, oral plaque, and fungal infections.",
    waterRequirement: "Low to Moderate (drought-resistant once established)",
    fertilizerRequirement: "Organic compost or NPK once or twice a year in growing season",
    bestSeason: "Early spring or monsoon (June to August)",
    funFact: "Known as 'The Golden Tree' or 'Nature's Drugstore' because of its versatility in traditional medicine.",
    image: "https://images.unsplash.com/photo-1615560113917-d51ece263059?w=400&auto=format&fit=crop&q=60"
  },
  {
    id: "banyan",
    name: "Banyan Tree",
    scientificName: "Ficus benghalensis",
    oxygenProduction: "Extremely High (massive canopy acts as a major oxygen chamber)",
    carbonAbsorbed: "Approximately 30-40 kg CO2 per year (large scale)",
    fruitsFlowers: "Small red figs that attract many birds and bats; flowers are enclosed inside the figs",
    medicinalUses: "Anti-inflammatory, anti-diabetic, relieves diarrhea, treats gum disorders.",
    leavesUses: "Applied as a poultice on abscesses; young leaves are used to treat dysentery.",
    rootsBarkUses: "Areal roots are used for cleaning teeth and gums; bark paste heals bruises.",
    diseasesHelped: "Arthritis, diabetes, tooth decay, chronic diarrhea, and dysentery.",
    waterRequirement: "Moderate (needs deep watering during early growth, then self-sustaining)",
    fertilizerRequirement: "Enriched soil, compost addition in spring",
    bestSeason: "Late spring / Pre-monsoon (March to June)",
    funFact: "It is the National Tree of India and grows aerial roots that become trunk-like, allowing a single tree to cover several acres.",
    image: "https://images.unsplash.com/photo-1596701062351-df5f8a4261e5?w=400&auto=format&fit=crop&q=60"
  },
  {
    id: "peepal",
    name: "Peepal Tree (Sacred Fig)",
    scientificName: "Ficus religiosa",
    oxygenProduction: "Extremely High (24-hour oxygen release due to Crassulacean Acid Metabolism)",
    carbonAbsorbed: "Approximately 25-30 kg CO2 per year",
    fruitsFlowers: "Small green figs turning purple/black when ripe; flowers inside the receptacle.",
    medicinalUses: "Treats asthma, cleanses blood, heals wounds, treats digestive issues.",
    leavesUses: "Juice is used to relieve ear pain, cure constipation, and treat coughs.",
    rootsBarkUses: "Bark decoction used for skin diseases, ulcers, and strengthening gums.",
    diseasesHelped: "Asthma, eczema, jaundice, diarrhea, and gastric problems.",
    waterRequirement: "Moderate (drought-hardy but thrives with regular moisture)",
    fertilizerRequirement: "Minimal; compost during planting and annually",
    bestSeason: "Spring (February to April)",
    funFact: "Gautama Buddha attained enlightenment while meditating under a Peepal tree, which is why it is also known as the Bodhi Tree.",
    image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=400&auto=format&fit=crop&q=60"
  },
  {
    id: "aloe_vera",
    name: "Aloe Vera",
    scientificName: "Aloe barbadensis miller",
    oxygenProduction: "High (releases oxygen at night, purifies benzene and formaldehyde from air)",
    carbonAbsorbed: "Approximately 2-3 kg CO2 per year (small plant)",
    fruitsFlowers: "Yellow or red tubular flowers on a tall spike (blooms in summer)",
    medicinalUses: "Soothes burns, moisturizes skin, speeds wound healing, aids digestion.",
    leavesUses: "Gel is extracted for cosmetics, juices, and skin ointments; rind has laxative properties.",
    rootsBarkUses: "Rarely used; roots have mild antimicrobial properties in traditional systems.",
    diseasesHelped: "Sunburn, acid reflux, dry skin, minor wounds, and constipation.",
    waterRequirement: "Very Low (succulent; water only when soil is completely dry)",
    fertilizerRequirement: "Succulent fertilizer once a year in spring",
    bestSeason: "Spring or early summer",
    funFact: "Ancient Egyptians called Aloe Vera 'the plant of immortality' and used it as part of their embalming rituals.",
    image: "https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=400&auto=format&fit=crop&q=60"
  },
  {
    id: "tulsi",
    name: "Holy Basil (Tulsi)",
    scientificName: "Ocimum tenuiflorum",
    oxygenProduction: "High (acts as a natural air purifier, emits oxygen 20 hours a day)",
    carbonAbsorbed: "Approximately 4-6 kg CO2 per year",
    fruitsFlowers: "Small purple/magenta flowers on spikes; seeds are tiny nutlets.",
    medicinalUses: "Relieves stress, boosts immunity, anti-pyretic (reduces fever), heals respiratory issues.",
    leavesUses: "Chewed raw or brewed in tea to cure cough, cold, fever, and digestive bugs.",
    rootsBarkUses: "Root paste applied on insect bites; seeds used for cooling drinks.",
    diseasesHelped: "Influenza, bronchitis, high stress, high blood sugar, and skin infections.",
    waterRequirement: "Moderate (needs daily watering but well-drained soil)",
    fertilizerRequirement: "Liquid organic fertilizer every 4-6 weeks in summer",
    bestSeason: "Spring (after last frost) or Monsoon",
    funFact: "Tulsi contains active phytochemicals like eugenol, which is scientifically proven to reduce physical, chemical, and metabolic stress.",
    image: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=400&auto=format&fit=crop&q=60"
  }
];

const initialQuizzes = [
  {
    id: 1,
    question: "Which of these trees is scientifically proven to release oxygen 24 hours a day due to its nocturnal metabolic pathway?",
    options: [
      "Mango Tree",
      "Peepal Tree (Sacred Fig)",
      "Eucalyptus Tree",
      "Oak Tree"
    ],
    correctAnswer: 1,
    explanation: "Peepal Tree releases oxygen day and night due to a special photosynthetic process called Crassulacean Acid Metabolism (CAM)."
  },
  {
    id: 2,
    question: "What is the primary danger of disposing of E-waste (like phones and batteries) in regular trash bins?",
    options: [
      "It makes the garbage smell worse",
      "Heavy metals like lead, mercury, and cadmium leak into the soil and groundwater",
      "It stops plastic from decomposing",
      "It attracts wild animals"
    ],
    correctAnswer: 1,
    explanation: "E-waste contains hazardous materials (lead, cadmium, mercury) that leach into soil and contaminate groundwater, posing severe health hazards."
  },
  {
    id: 3,
    question: "Which type of waste takes the longest time to decompose in a landfill?",
    options: [
      "Orange peels (organic waste)",
      "Cardboard boxes",
      "Plastic bottles & bags",
      "Aluminum cans"
    ],
    correctAnswer: 2,
    explanation: "Plastic bags and bottles can take up to 450 to 1,000 years to decompose, and some never fully break down, turning into microplastics instead."
  },
  {
    id: 4,
    question: "How does planting trees in urban areas reduce the 'Urban Heat Island' effect?",
    options: [
      "By absorbing sound waves",
      "Through shade and evapotranspiration (cooling the surrounding air)",
      "By blocking wind currents",
      "By changing the wind direction"
    ],
    correctAnswer: 1,
    explanation: "Trees cool cities through shade and by releasing moisture through evapotranspiration, lowering local temperatures by up to 2-8°C."
  },
  {
    id: 5,
    question: "Which of the following household items should NOT be put in a home composting bin?",
    options: [
      "Coffee grounds & filters",
      "Eggshells",
      "Meat, bones, and dairy products",
      "Dry leaves and newspaper shreds"
    ],
    correctAnswer: 2,
    explanation: "Meat, bones, and dairy attract pests (rats, flies) and create foul odors due to anaerobic decomposition. They should be composted in specialized commercial facilities."
  }
];

const initialEWasteCenters = [
  {
    id: 1,
    name: "EcoCycle Authorized E-Waste Center",
    lat: 12.9716,
    lng: 77.5946,
    address: "102, Green Arcade, Near Central Library, City Center",
    phone: "+91 98765 43210",
    acceptedItems: ["Mobile phones", "Laptops", "Batteries", "Chargers", "TVs"],
    pointsPerKg: 150
  },
  {
    id: 2,
    name: "CleanPlanet E-Recycling Hub",
    lat: 12.9592,
    lng: 77.6214,
    address: "Plot 45-B, Industrial Layout, Koramangala Sector 4",
    phone: "+91 99887 76655",
    acceptedItems: ["Laptops", "TVs", "Electronic appliances", "Chargers"],
    pointsPerKg: 120
  },
  {
    id: 3,
    name: "GreenSafe Battery & Mobile Recyclers",
    lat: 12.9882,
    lng: 77.5636,
    address: "Shop 12, Metro Mall Ground Floor, Rajajinagar",
    phone: "+91 88776 65544",
    acceptedItems: ["Batteries", "Mobile phones", "Chargers"],
    pointsPerKg: 180
  }
];

const initialLeaderboard = [
  { rank: 1, name: "Aarav Sharma", level: 12, points: 2850, badge: "🌳 Grand Eco-Guardian" },
  { rank: 2, name: "Priya Patel", level: 9, points: 1980, badge: "🌿 Leaf Legend" },
  { rank: 3, name: "Rohit Verma", level: 8, points: 1720, badge: "🗑️ Spotless Knight" },
  { rank: 4, name: "You", level: 1, points: 0, badge: "🌱 Green Novice" },
  { rank: 5, name: "Neha Sen", level: 6, points: 1240, badge: "♻️ Recycle Ranger" },
  { rank: 6, name: "Amit Das", level: 5, points: 950, badge: "🌱 Green Novice" }
];

const initialVouchers = [
  {
    id: "nursery_50",
    title: "Rs. 50 Nursery Voucher",
    description: "Get Rs. 50 off on any plant at 'Green Growth Municipal Nursery'.",
    pointsCost: 300,
    category: "nursery",
    icon: "fa-seedling"
  },
  {
    id: "transport_pass",
    title: "1-Day Metro Pass",
    description: "Get a free 1-day travel pass on any City Metro route.",
    pointsCost: 500,
    category: "transport",
    icon: "fa-subway"
  },
  {
    id: "tax_benefit",
    title: "0.5% Municipal Tax Rebate",
    description: "Receive a 0.5% rebate on your annual municipal property tax invoice.",
    pointsCost: 1500,
    category: "tax",
    icon: "fa-file-invoice-dollar"
  },
  {
    id: "gift_amazon",
    title: "Rs. 100 E-Shopping Card",
    description: "Redeem for a Rs. 100 gift voucher code on major online retailers.",
    pointsCost: 800,
    category: "shopping",
    icon: "fa-gift"
  }
];

// Export modules to window object for access in other scripts
window.EcoVerseData = {
  plants: initialPlants,
  quizzes: initialQuizzes,
  eWasteCenters: initialEWasteCenters,
  leaderboard: initialLeaderboard,
  vouchers: initialVouchers
};
