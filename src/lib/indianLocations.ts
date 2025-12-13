// Comprehensive India Location Database
// All states, union territories, and major cities/districts

export interface LocationResult {
  name: string;
  type: 'state' | 'district' | 'city';
  parent?: string;
  fullName?: string;
}

// All Indian States and Union Territories
export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

// Districts/Cities by State
export const DISTRICTS_BY_STATE: Record<string, string[]> = {
  "Andhra Pradesh": [
    "Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool",
    "Nellore", "Prakasam", "Srikakulam", "Visakhapatnam", "Vizianagaram",
    "West Godavari", "YSR Kadapa", "Vijayawada", "Tirupati", "Rajahmundry",
    "Kakinada", "Eluru", "Ongole", "Nandyal", "Machilipatnam", "Tenali"
  ],
  "Arunachal Pradesh": [
    "Anjaw", "Changlang", "Dibang Valley", "East Kameng", "East Siang",
    "Itanagar", "Kurung Kumey", "Lohit", "Lower Dibang Valley", "Lower Subansiri",
    "Papum Pare", "Tawang", "Tirap", "Upper Siang", "Upper Subansiri", "West Kameng",
    "West Siang", "Naharlagun", "Ziro", "Pasighat"
  ],
  "Assam": [
    "Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo",
    "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao",
    "Goalpara", "Golaghat", "Guwahati", "Hailakandi", "Hojai", "Jorhat",
    "Kamrup", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli",
    "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "Tezpur",
    "Silchar", "Tinsukia", "Udalguri", "West Karbi Anglong"
  ],
  "Bihar": [
    "Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur",
    "Bhojpur", "Buxar", "Darbhanga", "East Champaran", "Gaya", "Gopalganj",
    "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj",
    "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda",
    "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran",
    "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali",
    "West Champaran", "Hajipur", "Sasaram", "Dehri", "Bettiah", "Motihari"
  ],
  "Chhattisgarh": [
    "Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur",
    "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Janjgir-Champa",
    "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Koriya",
    "Mahasamund", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon",
    "Sukma", "Surajpur", "Surguja", "Bhilai", "Ambikapur", "Jagdalpur"
  ],
  "Goa": [
    "North Goa", "South Goa", "Panaji", "Margao", "Vasco da Gama", "Mapusa",
    "Ponda", "Bicholim", "Curchorem", "Canacona", "Quepem", "Sanguem",
    "Calangute", "Candolim", "Anjuna", "Vagator", "Baga"
  ],
  "Gujarat": [
    "Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch",
    "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod", "Dang", "Devbhoomi Dwarka",
    "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch",
    "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal",
    "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar",
    "Tapi", "Vadodara", "Valsad", "Bhuj", "Ankleshwar", "Vapi", "Nadiad",
    "Gandhidham", "Veraval", "Godhra", "Palanpur", "Bharuch"
  ],
  "Haryana": [
    "Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram",
    "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh",
    "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa",
    "Sonipat", "Yamunanagar", "Bahadurgarh", "Thanesar", "Narnaul", "Hansi",
    "Tosham", "Ladwa"
  ],
  "Himachal Pradesh": [
    "Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti",
    "Mandi", "Shimla", "Sirmaur", "Solan", "Una", "Dharamshala", "Manali",
    "Palampur", "Nahan", "Sundernagar", "Paonta Sahib", "Baddi", "Kasauli",
    "Dalhousie", "McLeod Ganj", "Keylong"
  ],
  "Jharkhand": [
    "Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum",
    "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Jamshedpur",
    "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh",
    "Ranchi", "Sahebganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum",
    "Chaibasa", "Medininagar"
  ],
  "Karnataka": [
    "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban",
    "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga",
    "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri",
    "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur",
    "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura",
    "Yadgir", "Mangaluru", "Hubballi-Dharwad", "Bengaluru"
  ],
  "Kerala": [
    "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam",
    "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta",
    "Thiruvananthapuram", "Thrissur", "Wayanad", "Kochi", "Munnar", 
    "Thekkady", "Kumarakom", "Guruvayur", "Kovalam", "Varkala", "Bekal", 
    "Fort Kochi"
  ],
  "Madhya Pradesh": [
    "Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani",
    "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara",
    "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda",
    "Hoshangabad", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone",
    "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Panna", "Raisen",
    "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol",
    "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh",
    "Ujjain", "Umaria", "Vidisha", "Orchha", "Khajuraho", "Sanchi", "Pachmarhi"
  ],
  "Maharashtra": [
    "Ahmednagar", "Akola", "Amravati", "Chhatrapati Sambhajinagar", "Beed", "Bhandara",
    "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli",
    "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban",
    "Nagpur", "Nanded", "Nandurbar", "Nashik", "Dharashiv", "Palghar", "Parbhani",
    "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur",
    "Thane", "Wardha", "Washim", "Yavatmal", "Navi Mumbai", "Panvel", "Kalyan",
    "Dombivli", "Vasai", "Virar", "Mira Road", "Bhiwandi", "Ulhasnagar",
    "Mahabaleshwar", "Lonavala", "Shirdi", "Alibag", "Lavasa"
  ],
  "Manipur": [
    "Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West",
    "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl",
    "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul", "Imphal",
    "Moreh", "Moirang"
  ],
  "Meghalaya": [
    "East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "North Garo Hills",
    "Ri Bhoi", "South Garo Hills", "South West Garo Hills", "South West Khasi Hills",
    "West Garo Hills", "West Jaintia Hills", "West Khasi Hills", "Shillong",
    "Tura", "Jowai", "Nongstoin", "Williamnagar", "Baghmara", "Cherrapunji"
  ],
  "Mizoram": [
    "Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Kolasib", "Lawngtlai",
    "Lunglei", "Mamit", "Saiha", "Saitual", "Serchhip", "Champhai Town"
  ],
  "Nagaland": [
    "Chümoukedima", "Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung",
    "Mon", "Noklak", "Peren", "Phek", "Tuensang", "Wokha", "Zunheboto"
  ],
  "Odisha": [
    "Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack",
    "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur",
    "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar", "Khordha",
    "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada",
    "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh", "Bhubaneswar",
    "Rourkela", "Berhampur", "Konark", "Paradip"
  ],
  "Punjab": [
    "Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka",
    "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana",
    "Malerkotla", "Mansa", "Moga", "Mohali", "Muktsar", "Pathankot", "Patiala",
    "Rupnagar", "Sangrur", "Shaheed Bhagat Singh Nagar", "Tarn Taran", "Zirakpur",
    "Phagwara", "Khanna", "Batala", "Abohar", "Rajpura"
  ],
  "Rajasthan": [
    "Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara",
    "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur",
    "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu",
    "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand",
    "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur",
    "Mount Abu", "Pushkar", "Ranthambore", "Mandawa", "Bhangarh"
  ],
  "Sikkim": [
    "East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim", "Gangtok",
    "Namchi", "Pelling", "Lachung", "Ravangla", "Yuksom", "Mangan", "Gyalshing"
  ],
  "Tamil Nadu": [
    "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri",
    "Dindigul", "Erode", "Kallakurichi", "Kancheepuram", "Kanyakumari", "Karur",
    "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal",
    "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem",
    "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli",
    "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai",
    "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar", "Ooty", "Kodaikanal",
    "Mahabalipuram", "Rameswaram"
  ],
  "Telangana": [
    "Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon",
    "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar",
    "Khammam", "Komaram Bheem", "Mahabubabad", "Mahabubnagar", "Mancherial",
    "Medak", "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda",
    "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla",
    "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy",
    "Warangal Rural", "Warangal Urban", "Yadadri Bhuvanagiri", "Secunderabad",
    "Cyberabad", "HITEC City", "Gachibowli", "Banjara Hills", "Jubilee Hills"
  ],
  "Tripura": [
    "Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura",
    "Unakoti", "West Tripura", "Agartala", "Udaipur", "Dharmanagar", "Kailasahar"
  ],
  "Uttar Pradesh": [
    "Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Ayodhya",
    "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki",
    "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli",
    "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad",
    "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur",
    "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj",
    "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kushinagar", "Lakhimpur Kheri",
    "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau",
    "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh",
    "Prayagraj", "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar",
    "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra",
    "Sultanpur", "Unnao", "Varanasi", "Noida", "Greater Noida", "Vrindavan", 
    "Fatehpur Sikri", "Sarnath"
  ],
  "Uttarakhand": [
    "Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar",
    "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal",
    "Udham Singh Nagar", "Uttarkashi", "Rishikesh", "Mussoorie", "Roorkee",
    "Haldwani", "Kashipur", "Rudrapur", "Jim Corbett", "Ranikhet", "Auli",
    "Badrinath", "Kedarnath", "Gangotri", "Yamunotri", "Valley of Flowers"
  ],
  "West Bengal": [
    "Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur",
    "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong",
    "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman",
    "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia",
    "South 24 Parganas", "Uttar Dinajpur", "Siliguri", "Durgapur", "Asansol",
    "Kharagpur", "Haldia", "Santiniketan", "Sundarbans", "Digha", "Shantiniketan"
  ],
  "Andaman and Nicobar Islands": [
    "Nicobar", "North and Middle Andaman", "South Andaman", "Port Blair",
    "Havelock Island", "Neil Island", "Ross Island", "Cellular Jail"
  ],
  "Chandigarh": [
    "Chandigarh", "Sector 17", "Sector 22", "Sector 35", "Manimajra",
    "Panchkula", "Mohali", "Zirakpur"
  ],
  "Dadra and Nagar Haveli and Daman and Diu": [
    "Dadra and Nagar Haveli", "Daman", "Diu", "Silvassa", "Moti Daman",
    "Nani Daman", "Diu Town"
  ],
  "Delhi": [
    "Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi",
    "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi",
    "West Delhi", "Connaught Place", "Karol Bagh", "Chandni Chowk", "Lajpat Nagar",
    "Saket", "Vasant Kunj", "Dwarka", "Rohini", "Pitampura", "Janakpuri",
    "Rajouri Garden", "Greater Kailash", "Defence Colony", "Hauz Khas",
    "Nehru Place", "Okhla", "Laxmi Nagar", "Preet Vihar", "Mayur Vihar"
  ],
  "Jammu and Kashmir": [
    "Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal",
    "Jammu", "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Poonch", "Pulwama",
    "Rajouri", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur",
    "Gulmarg", "Pahalgam", "Sonamarg", "Patnitop", "Vaishno Devi", "Leh"
  ],
  "Ladakh": [
    "Leh", "Kargil", "Nubra Valley", "Pangong Lake", "Tso Moriri", "Zanskar",
    "Hemis", "Thiksey", "Diskit", "Khardung La"
  ],
  "Lakshadweep": [
    "Agatti", "Amini", "Andrott", "Bangaram", "Bitra", "Chetlat", "Kadmat",
    "Kalpeni", "Kavaratti", "Kiltan", "Minicoy"
  ],
  "Puducherry": [
    "Karaikal", "Mahe", "Puducherry", "Yanam", "Auroville", "White Town", 
    "Promenade Beach"
  ]
};

// Flatten all cities for quick search
const ALL_LOCATIONS: LocationResult[] = [];
INDIAN_STATES.forEach(state => {
  ALL_LOCATIONS.push({ name: state, type: 'state' });
  const districts = DISTRICTS_BY_STATE[state] || [];
  districts.forEach(district => {
    ALL_LOCATIONS.push({
      name: district,
      type: 'city',
      parent: state,
      fullName: `${district}, ${state}`
    });
  });
});

// Popular cities for quick access (using current official names)
export const POPULAR_CITIES = [
  "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune",
  "Ahmedabad", "Jaipur", "Lucknow", "Surat", "Kanpur Nagar", "Nagpur", "Indore",
  "Thane", "Bhopal", "Visakhapatnam", "Vadodara", "Ghaziabad", "Ludhiana",
  "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Varanasi", "Srinagar",
  "Chhatrapati Sambhajinagar", "Dhanbad", "Amritsar", "Navi Mumbai", "Prayagraj", "Ranchi",
  "Howrah", "Coimbatore", "Jabalpur", "Gwalior", "Vijayawada", "Jodhpur",
  "Madurai", "Raipur", "Kota", "Chandigarh", "Guwahati", "Solapur",
  "Noida", "Gurugram", "Kochi", "Thiruvananthapuram", "Mysuru", "Mangaluru"
];

// Search locations
export const searchLocations = (query: string): LocationResult[] => {
  if (!query || query.length < 2) {
    return POPULAR_CITIES.slice(0, 15).map(city => {
      const found = ALL_LOCATIONS.find(l => l.name === city && l.type === 'city');
      return found || { name: city, type: 'city' as const };
    });
  }

  const lowerQuery = query.toLowerCase();
  const results: LocationResult[] = [];
  const seen = new Set<string>();

  // Exact matches first
  ALL_LOCATIONS.forEach(loc => {
    if (loc.name.toLowerCase() === lowerQuery && !seen.has(loc.fullName || loc.name)) {
      results.push(loc);
      seen.add(loc.fullName || loc.name);
    }
  });

  // Starts with query
  ALL_LOCATIONS.forEach(loc => {
    if (loc.name.toLowerCase().startsWith(lowerQuery) && !seen.has(loc.fullName || loc.name)) {
      results.push(loc);
      seen.add(loc.fullName || loc.name);
    }
  });

  // Contains query
  ALL_LOCATIONS.forEach(loc => {
    if (loc.name.toLowerCase().includes(lowerQuery) && !seen.has(loc.fullName || loc.name)) {
      results.push(loc);
      seen.add(loc.fullName || loc.name);
    }
  });

  return results.slice(0, 20);
};

// Async wrapper for compatibility
export const searchCities = async (query: string): Promise<string[]> => {
  const results = searchLocations(query);
  return results.map(r => r.fullName || r.name);
};

// Sync version
export const searchCitiesSync = (query: string): string[] => {
  const results = searchLocations(query);
  return results.map(r => r.fullName || r.name);
};

// Get all cities
export const getCities = async (): Promise<string[]> => {
  return POPULAR_CITIES;
};

export const getCitiesSync = (): string[] => {
  return POPULAR_CITIES;
};

// Get states
export const fetchStates = async (): Promise<string[]> => {
  return INDIAN_STATES;
};

// Get districts for a state
export const fetchDistricts = async (stateName: string): Promise<string[]> => {
  return DISTRICTS_BY_STATE[stateName] || [];
};

// Search areas within a city
export const searchAreas = async (city: string, query: string): Promise<string[]> => {
  // For now, return generic areas. In future, this could be enhanced with more specific data
  const baseAreas = [`${city} Central`, `${city} North`, `${city} South`, `${city} East`, `${city} West`];
  
  if (!query) return baseAreas;
  
  const lowerQuery = query.toLowerCase();
  return baseAreas.filter(area => area.toLowerCase().includes(lowerQuery));
};

// Get areas for city (legacy)
export const getAreasForCity = (city: string): string[] => {
  return [`${city} Central`, `${city} North`, `${city} South`, `${city} East`, `${city} West`];
};