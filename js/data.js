const RATE = 4100;

const I18N = {
  en: {
    home:"Home", bookings:"Bookings", wishlist:"Wishlist", offers:"Offers", profile:"Profile",
    flights:"Flights", hotels:"Hotels", taxi:"Taxi", tours:"Tours", activities:"Activities",
    searchPh:"Search destinations, tours...", popular:"Popular Destinations", summer:"Summer Getaway",
    bookNow:"Book Now", promoText:"Amazing tours. Exclusive deals. Limited time offer!",
    heroTitle:"Discover. Travel. Remember.", heroSub:"Unforgettable journeys, crafted just for you.",
    from:"From", to:"To", depart:"Departure date", ret:"Return date", pax:"Passengers", cls:"Class",
    economy:"Economy", business:"Business", city:"City or hotel", checkin:"Check-in", checkout:"Check-out",
    guests:"Guests", rooms:"Rooms", pickup:"Pickup location", dropoff:"Drop-off location", pickTime:"Pickup time",
    rideType:"Ride type", standard:"Standard", suv:"SUV", premium:"Premium", tuktuk:"TukTuk",
    dest:"Destination", date:"Preferred date", category:"Category", adventure:"Adventure", culture:"Culture", food:"Food", relax:"Relax",
    searchFlights:"Search flights", searchHotels:"Search stays", searchTaxi:"Find a ride", searchTours:"Search",
    summary:"Booking summary", details:"Guest details", payment:"Payment", done:"Booking confirmed",
    fullName:"Full name", email:"Email", next:"Continue", back:"Back", pay:"Pay now", total:"Total",
    voucher:"E-voucher", download:"Download voucher", close:"Close", ref:"Reference",
    addedWish:"Added to wishlist", removedWish:"Removed from wishlist", booked:"Booking confirmed!",
    noBookings:"No bookings yet. Pick a destination to start.", noWish:"Nothing saved yet. Tap ❤️ on a destination.",
    fillName:"Enter your full name to continue", downloaded:"Voucher saved (demo)", searching:"Searching",
    off1:"20% off first Siem Reap stay", off2:"Free airport pickup on Bali tours", off3:"KHQR cashback this weekend",
    tripDate:"Travel date", rate:"Rate: $1 = 4,100 ៛"
  },
  km: {
    home:"ទំព័រដើម", bookings:"ការកក់ទុក", wishlist:"បញ្ជីប្រាថ្នា", offers:"ការផ្តល់ជូន", profile:"គណនី",
    flights:"ជើងហោះហើរ", hotels:"សណ្ឋាគារ", taxi:"តាក់ស៊ី", tours:"ទស្សនាចរណ៍", activities:"សកម្មភាព",
    searchPh:"ស្វែងរកគោលដៅ, ទស្សនាចរណ៍...", popular:"គោលដៅពេញនិយម", summer:"កញ្ចប់វិស្សមកាលរដូវក្តៅ",
    bookNow:"កក់ឥឡូវនេះ", promoText:"ដំណើរកម្សាន្តអស្ចារ្យ។ ការផ្តល់ជូនពិសេស។ ពេលវេលាមានកំណត់!",
    heroTitle:"ស្វែងរក។ ធ្វើដំណើរ។ ចងចាំ។", heroSub:"បទពិសោធន៍ធ្វើដំណើរដែលមិនអាចបំភ្លេចបាន បង្កើតឡើងយ៉ាងពិសេសសម្រាប់អ្នក។",
    from:"ចេញពី", to:"ទៅកាន់", depart:"ថ្ងៃចេញដំណើរ", ret:"ថ្ងៃត្រឡប់", pax:"អ្នកដំណើរ", cls:"ថ្នាក់",
    economy:"សេដ្ឋកិច្ច", business:"អាជីវកម្ម", city:"ទីក្រុង ឬសណ្ឋាគារ", checkin:"ចូលស្នាក់", checkout:"ចេញ",
    guests:"ភ្ញៀវ", rooms:"បន្ទប់", pickup:"ទីតាំងទទួល", dropoff:"ទីតាំងទម្លាក់", pickTime:"ម៉ោងទទួល",
    rideType:"ប្រភេទរថយន្ត", standard:"ធម្មតា", suv:"SUV", premium:"ពិសេស", tuktuk:"ម៉ូតូកង់បី",
    dest:"គោលដៅ", date:"កាលបរិច្ឆេទ", category:"ប្រភេទ", adventure:"ដំណើរផ្សងព្រេង", culture:"វប្បធម៌", food:"អាហារ", relax:"សម្រាក",
    searchFlights:"ស្វែងរកជើងហោះហើរ", searchHotels:"ស្វែងរកកន្លែងស្នាក់នៅ", searchTaxi:"ស្វែងរកតាក់ស៊ី", searchTours:"ស្វែងរក",
    summary:"សង្ខេបការកក់", details:"ព័ត៌មានភ្ញៀវ", payment:"ការទូទាត់", done:"ការកក់បានបញ្ជាក់",
    fullName:"ឈ្មោះពេញ", email:"អ៊ីមែល", next:"បន្ត", back:"ថយក្រោយ", pay:"បង់ឥឡូវនេះ", total:"សរុប",
    voucher:"ប័ណ្ណអេឡិចត្រូនិក", download:"ទាញយកប័ណ្ណ", close:"បិទ", ref:"លេខយោង",
    addedWish:"បានបន្ថែមទៅបញ្ជីប្រាថ្នា", removedWish:"បានដកចេញពីបញ្ជីប្រាថ្នា", booked:"ការកក់បានបញ្ជាក់!",
    noBookings:"មិនទាន់មានការកក់ទេ។ ជ្រើសរើសគោលដៅដើម្បីចាប់ផ្តើម។", noWish:"មិនទាន់មានអ្វីរក្សាទុកទេ។ ចុច ❤️ លើគោលដៅ។",
    fillName:"សូមបញ្ចូលឈ្មោះពេញ", downloaded:"បានរក្សាទុកប័ណ្ណ (សាកល្បង)", searching:"កំពុងស្វែងរក",
    off1:"បញ្ចុះតម្លៃ ២០% សម្រាប់ការស្នាក់នៅលើកដំបូងនៅសៀមរាប", off2:"ទទួលពីព្រលានយន្តហោះឥតគិតថ្លៃ សម្រាប់ដំណើរទៅបាលី", off3:"សង់ប្រាក់វិញតាម KHQR ចុងសប្តាហ៍នេះ",
    tripDate:"ថ្ងៃធ្វើដំណើរ", rate:"អត្រា៖ $1 = 4,100 ៛"
  }
};

const DESTS = [
  {id:"bali",  name:{en:"Bali, Indonesia",km:"បាលី, ឥណ្ឌូណេស៊ី"}, usd:699,  rating:4.9, emoji:"🌴", bg:"linear-gradient(135deg,#0ea5e9,#14b8a6)"},
  {id:"siem",  name:{en:"Siem Reap, Cambodia",km:"សៀមរាប, កម្ពុជា"}, usd:350,  rating:4.9, emoji:"🛕", bg:"linear-gradient(135deg,#d97706,#92400e)"},
  {id:"mald",  name:{en:"Maldives",km:"ម៉ាល់ឌីវ"},               usd:899,  rating:4.8, emoji:"🏝️", bg:"linear-gradient(135deg,#06b6d4,#3b82f6)"},
  {id:"swiss", name:{en:"Switzerland",km:"ស្វីស"},                usd:1299, rating:4.9, emoji:"🏔️", bg:"linear-gradient(135deg,#64748b,#38bdf8)"},
  {id:"tokyo", name:{en:"Tokyo, Japan",km:"តូក្យូ, ជប៉ុន"},        usd:950,  rating:4.8, emoji:"🗼", bg:"linear-gradient(135deg,#db2777,#7c3aed)"}
];

const PLACES = ["Siem Reap","Phnom Penh","Bali","Tokyo","Paris","Maldives","Switzerland","Sihanoukville","Bangkok","Singapore"];

const TABS = [
  {id:"flights",   icon:"✈️"},
  {id:"hotels",    icon:"🏨"},
  {id:"taxi",      icon:"🚕"},
  {id:"tours",     icon:"🗺️"},
  {id:"activities",icon:"🎟️"}
];

// Field types: text | date | time | num | select:[values]
const FORMS = {
  flights:[{k:"from",t:"text",full:0},{k:"to",t:"text"},{k:"depart",t:"date"},{k:"ret",t:"date"},
           {k:"pax",t:"num"},{k:"cls",t:"select",o:["economy","business"]}],
  hotels:[{k:"city",t:"text",full:1},{k:"checkin",t:"date"},{k:"checkout",t:"date"},{k:"guests",t:"num"},{k:"rooms",t:"num"}],
  taxi:[{k:"pickup",t:"text",full:1},{k:"dropoff",t:"text",full:1},{k:"pickTime",t:"time"},
        {k:"rideType",t:"select",o:["standard","suv","premium","tuktuk"]}],
  tours:[{k:"dest",t:"text",full:1},{k:"date",t:"date"},{k:"category",t:"select",o:["adventure","culture","food","relax"]}],
  activities:[{k:"dest",t:"text",full:1},{k:"date",t:"date"},{k:"category",t:"select",o:["adventure","culture","food","relax"]}]
};
const CTA = {flights:"searchFlights",hotels:"searchHotels",taxi:"searchTaxi",tours:"searchTours",activities:"searchTours"};
const PAYMENTS = [{id:"card",label:"💳 Credit Card"},{id:"aba",label:"🏦 ABA PAY"},{id:"khqr",label:"📱 KHQR"},{id:"paypal",label:"🅿️ PayPal"}];
