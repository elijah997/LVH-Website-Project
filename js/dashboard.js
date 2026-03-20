/* =============================================
   Lake Victoria Hotel — Admin Dashboard JS
   ============================================= */

(function () {
    'use strict';

    /* =============================================
       DATA LAYER — Dual storage: localStorage + IndexedDB backup
       ============================================= */
    const STORAGE_KEY = 'lvh_dashboard';
    const SITE_ANALYTICS_KEY = 'lvh_site_analytics';
    const MAX_LOG_ENTRIES = 500;
    const IDB_NAME = 'lvh_hotel_db';
    const IDB_STORE = 'dashboard';
    const IDB_VERSION = 1;
    let _dataSource = 'localStorage'; // tracks where data was loaded from

    /* ---------- IndexedDB helpers ---------- */
    function openIDB() {
        return new Promise(function (resolve, reject) {
            var req = indexedDB.open(IDB_NAME, IDB_VERSION);
            req.onupgradeneeded = function () { req.result.createObjectStore(IDB_STORE); };
            req.onsuccess = function () { resolve(req.result); };
            req.onerror = function () { reject(req.error); };
        });
    }

    function idbSave(data) {
        openIDB().then(function (db) {
            var tx = db.transaction(IDB_STORE, 'readwrite');
            tx.objectStore(IDB_STORE).put(JSON.stringify(data), STORAGE_KEY);
        }).catch(function () { /* IndexedDB unavailable — silent */ });
    }

    function idbLoad() {
        return openIDB().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(IDB_STORE, 'readonly');
                var req = tx.objectStore(IDB_STORE).get(STORAGE_KEY);
                req.onsuccess = function () { resolve(req.result ? JSON.parse(req.result) : null); };
                req.onerror = function () { reject(req.error); };
            });
        }).catch(function () { return null; });
    }

    const ACTION_TYPES = {
        room_rate_edit:        { label: 'Room Rate Updated',      icon: 'fa-tags',          color: '#c9a84c', category: 'room' },
        date_block:            { label: 'Date Blocked',           icon: 'fa-calendar-times', color: '#ef4444', category: 'room' },
        date_unblock:          { label: 'Date Unblocked',         icon: 'fa-calendar-check', color: '#22c55e', category: 'room' },
        room_content_edit:     { label: 'Room Content Updated',   icon: 'fa-image',         color: '#f59e0b', category: 'room' },
        room_name_edit:        { label: 'Room Name Changed',      icon: 'fa-pen',           color: '#3b82f6', category: 'room' },
        message_read:          { label: 'Message Read',           icon: 'fa-envelope-open', color: '#6b7280', category: 'message' },
        data_reset:            { label: 'Data Reset',             icon: 'fa-sync-alt',      color: '#ef4444', category: 'system' },
        surcharge_edit:        { label: 'Surcharge Updated',      icon: 'fa-user-plus',     color: '#c9a84c', category: 'room' },
        room_type_add:         { label: 'Room Type Added',        icon: 'fa-plus-circle',   color: '#22c55e', category: 'room' },
        room_type_delete:      { label: 'Room Type Removed',      icon: 'fa-trash-alt',     color: '#ef4444', category: 'room' },
        news_feed_edit:        { label: 'News Feed Updated',      icon: 'fa-newspaper',     color: '#3b82f6', category: 'content' },
        testimonial_added:     { label: 'Testimonial Featured',   icon: 'fa-star',          color: '#c9a84c', category: 'content' },
        testimonial_removed:   { label: 'Testimonial Unfeatured', icon: 'fa-star-half-alt', color: '#6b7280', category: 'content' },
        about_edit:            { label: 'About Page Updated',     icon: 'fa-users',         color: '#3b82f6', category: 'content' },
        menu_edit:             { label: 'Dining Menu Updated',    icon: 'fa-utensils',      color: '#c9a84c', category: 'content' }
    };

    const SITE_EVENT_LABELS = {
        page_view:          { label: 'Page View',            icon: 'fa-eye',            color: '#2c6e49' },
        booking_confirmed:  { label: 'Booking Email Sent',  icon: 'fa-envelope-check', color: '#22c55e' },
        contact_enquiry:    { label: 'Contact Enquiry',      icon: 'fa-comment-dots',   color: '#3b82f6' },
        availability_check: { label: 'Availability Check',  icon: 'fa-search',         color: '#c9a84c' },
        room_book_click:    { label: 'Book Now Click',       icon: 'fa-mouse-pointer',  color: '#8b5cf6' },
        pdf_download:       { label: 'PDF Download',         icon: 'fa-file-pdf',       color: '#ef4444' },
        guest_feedback:     { label: 'Guest Feedback',       icon: 'fa-comment-alt',    color: '#f59e0b' }
    };

    function addAuditEntry(action, category, details, meta) {
        if (!DATA.auditLog) DATA.auditLog = [];
        DATA.auditLog.unshift({
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
            timestamp: new Date().toISOString(),
            action: action,
            category: category || 'system',
            details: details || '',
            meta: meta || null,
            user: 'Admin'
        });
        if (DATA.auditLog.length > MAX_LOG_ENTRIES) DATA.auditLog.length = MAX_LOG_ENTRIES;
        saveData(DATA);
    }

    function loadSiteAnalytics() {
        try {
            return JSON.parse(localStorage.getItem(SITE_ANALYTICS_KEY) || '[]');
        } catch (e) { return []; }
    }

    const ROOM_TYPES = [
        'Ministerial Suite', 'Presidential Suite', 'Executive King',
        'Standard Single', 'Family Room', 'Executive Twin', 'Junior Suite'
    ];

    const ROOM_PRICES = {
        'Ministerial Suite': 280,
        'Presidential Suite': 350,
        'Executive King': 160,
        'Standard Single': 90,
        'Family Room': 200,
        'Executive Twin': 150,
        'Junior Suite': 140
    };

    // Returns default room types + any admin-added custom room types
    function getAllRoomTypes() {
        var custom = (DATA && DATA.customRooms) ? DATA.customRooms.map(function (r) { return r.key; }) : [];
        return ROOM_TYPES.concat(custom);
    }

    const DEFAULT_CONTENT = {
        'Ministerial Suite': {
            image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80',
            description: 'Lavish suite with panoramic lake views, a private lounge area, and premium personalised amenities.',
            bedType: 'King Bed', roomSize: '65 m²', maxGuests: '2 Guests'
        },
        'Presidential Suite': {
            image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80',
            description: 'Our most prestigious suite \u2014 butler service, private terrace, and exquisitely crafted d\u00e9cor throughout.',
            bedType: 'King Bed', roomSize: '90 m²', maxGuests: '2 Guests'
        },
        'Executive King': {
            image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600&q=80',
            description: 'Spacious executive room with a work desk, lake view, minibar, and all modern comforts for business travellers.',
            bedType: 'King Bed', roomSize: '42 m²', maxGuests: '2 Guests'
        },
        'Standard Single': {
            image: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&q=80',
            description: 'Comfortable and well-appointed single room with all essential amenities for an excellent night\u2019s rest.',
            bedType: 'Single Bed', roomSize: '22 m²', maxGuests: '1 Guest'
        },
        'Family Room': {
            image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&q=80',
            description: 'Generous family suite with interconnected rooms and multiple sleeping arrangements \u2014 perfect for families.',
            bedType: 'Multiple Beds', roomSize: '55 m²', maxGuests: '4 Guests'
        },
        'Executive Twin': {
            image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&q=80',
            description: 'Twin-bedded executive room ideal for colleagues travelling together, with full business amenities.',
            bedType: 'Twin Beds', roomSize: '38 m²', maxGuests: '2 Guests'
        },
        'Junior Suite': {
            image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=80',
            description: 'A refined junior suite with a separate sitting area, rich furnishings, and beautiful views of the grounds.',
            bedType: 'Queen Bed', roomSize: '38 m²', maxGuests: '2 Guests'
        }
    };

    const AVATAR_COLORS = ['green', 'gold', 'blue', 'purple'];

    function initials(name) {
        if (!name) return '?';
        return name.split(' ').map(w => w[0]).filter(Boolean).join('').toUpperCase() || '?';
    }

    function randomColor() {
        return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    }

    function fmtDate(d) {
        const date = new Date(d);
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
    }

    function timeAgo(d) {
        const now = new Date();
        const diff = Math.floor((now - new Date(d)) / 60000);
        if (diff < 1) return 'just now';
        if (diff < 60) return diff + 'm ago';
        if (diff < 1440) return Math.floor(diff / 60) + 'h ago';
        return Math.floor(diff / 1440) + 'd ago';
    }

    function generateSeedData() {
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        // Bookings (15) — retained for analytics revenue calculations
        const bookings = [
            { id: 1,  guest: 'Joseph Ssemakula',   room: 'Presidential Suite', checkin: '2026-02-25', checkout: '2026-03-01', status: 'checked-in', color: 'green' },
            { id: 2,  guest: 'Emma Thornton',       room: 'Executive King',     checkin: '2026-02-26', checkout: '2026-03-02', status: 'confirmed',  color: 'blue' },
            { id: 3,  guest: 'Ahmed Al-Rashid',     room: 'Ministerial Suite',  checkin: '2026-02-27', checkout: '2026-03-03', status: 'confirmed',  color: 'gold' },
            { id: 4,  guest: 'Grace Nakamya',       room: 'Junior Suite',       checkin: '2026-02-28', checkout: '2026-03-02', status: 'pending',    color: 'purple' },
            { id: 5,  guest: 'Michael Chen',        room: 'Executive Twin',     checkin: '2026-03-01', checkout: '2026-03-04', status: 'confirmed',  color: 'green' },
            { id: 6,  guest: 'Sarah Birungi',       room: 'Standard Single',    checkin: '2026-02-24', checkout: '2026-02-28', status: 'checked-in', color: 'blue' },
            { id: 7,  guest: 'Klaus Mueller',       room: 'Family Room',        checkin: '2026-03-02', checkout: '2026-03-06', status: 'confirmed',  color: 'gold' },
            { id: 8,  guest: 'Fatima Nakato',       room: 'Executive King',     checkin: '2026-02-23', checkout: '2026-02-26', status: 'cancelled',  color: 'purple' },
            { id: 9,  guest: 'David Ochieng',       room: 'Standard Single',    checkin: '2026-03-03', checkout: '2026-03-05', status: 'pending',    color: 'green' },
            { id: 10, guest: 'Olivia Bennett',      room: 'Junior Suite',       checkin: '2026-02-28', checkout: '2026-03-03', status: 'confirmed',  color: 'blue' },
            { id: 11, guest: 'Ivan Mugisha',        room: 'Executive Twin',     checkin: '2026-02-26', checkout: '2026-03-01', status: 'checked-in', color: 'gold' },
            { id: 12, guest: 'Yuki Tanaka',         room: 'Presidential Suite', checkin: '2026-03-05', checkout: '2026-03-08', status: 'pending',    color: 'purple' },
            { id: 13, guest: 'Robert Kiggundu',     room: 'Family Room',        checkin: '2026-02-27', checkout: '2026-03-02', status: 'confirmed',  color: 'green' },
            { id: 14, guest: 'Priya Sharma',        room: 'Ministerial Suite',  checkin: '2026-03-01', checkout: '2026-03-04', status: 'confirmed',  color: 'blue' },
            { id: 15, guest: 'Jean-Pierre Habimana',room: 'Executive King',     checkin: '2026-03-04', checkout: '2026-03-07', status: 'pending',    color: 'gold' }
        ];

        // Rooms (20)
        const rooms = [
            { number: '101', name: 'Standard Single',    floor: 1, status: 'occupied' },
            { number: '102', name: 'Standard Single',    floor: 1, status: 'available' },
            { number: '103', name: 'Executive Twin',     floor: 1, status: 'occupied' },
            { number: '104', name: 'Executive Twin',     floor: 1, status: 'available' },
            { number: '105', name: 'Executive King',     floor: 1, status: 'maintenance' },
            { number: '106', name: 'Executive King',     floor: 1, status: 'occupied' },
            { number: '107', name: 'Junior Suite',       floor: 1, status: 'available' },
            { number: '201', name: 'Executive King',     floor: 2, status: 'occupied' },
            { number: '202', name: 'Executive Twin',     floor: 2, status: 'reserved' },
            { number: '203', name: 'Junior Suite',       floor: 2, status: 'occupied' },
            { number: '204', name: 'Family Room',        floor: 2, status: 'occupied' },
            { number: '205', name: 'Family Room',        floor: 2, status: 'available' },
            { number: '206', name: 'Executive King',     floor: 2, status: 'occupied' },
            { number: '207', name: 'Standard Single',    floor: 2, status: 'available' },
            { number: '301', name: 'Ministerial Suite',  floor: 3, status: 'occupied' },
            { number: '302', name: 'Presidential Suite', floor: 3, status: 'occupied' },
            { number: '303', name: 'Junior Suite',       floor: 3, status: 'reserved' },
            { number: '304', name: 'Family Room',        floor: 3, status: 'available' },
            { number: '305', name: 'Executive King',     floor: 3, status: 'occupied' },
            { number: '306', name: 'Ministerial Suite',  floor: 3, status: 'maintenance' }
        ];

        // Messages (10)
        const messages = [
            { id: 1,  sender: 'Emma Thornton',      subject: 'Airport Transfer Request',      preview: 'Could you arrange a pickup from Entebbe Airport on Feb 26 at 2pm?', body: 'Dear team, I have a confirmed booking starting Feb 26. Could you please arrange a pickup from Entebbe International Airport? My flight arrives at 2:00 PM on Uganda Airlines. Thank you!', time: new Date(now - 45 * 60000).toISOString(), read: false },
            { id: 2,  sender: 'Klaus Mueller',       subject: 'Dietary Requirements',          preview: 'My family has specific dietary needs I would like to discuss...', body: 'Hello, I am travelling with my family of four. Two of us are vegetarian and my daughter has a gluten allergy. Could the kitchen accommodate these needs during our stay? We arrive March 2. Many thanks, Klaus.', time: new Date(now - 2 * 3600000).toISOString(), read: false },
            { id: 3,  sender: 'Priya Sharma',        subject: 'Conference Room Availability',  preview: 'I need to book a conference room for a business meeting on Mar 2...', body: 'Hi, I will be staying at the hotel from March 1-4 and would like to book a conference room for a team meeting on March 2 from 9am to 1pm. We will be approximately 12 people. Could you share pricing and AV equipment details?', time: new Date(now - 5 * 3600000).toISOString(), read: false },
            { id: 4,  sender: 'Robert Kiggundu',     subject: 'Late Check-out Request',        preview: 'Is it possible to extend my checkout to 3pm on March 2?', body: 'Good morning, I have a booking until March 2. My flight departs at 7pm from Entebbe so I was wondering if a late checkout around 3pm would be possible? Happy to pay a surcharge if needed.', time: new Date(now - 8 * 3600000).toISOString(), read: true },
            { id: 5,  sender: 'Joseph Ssemakula',    subject: 'Room Upgrade Inquiry',          preview: 'I am currently in the Presidential Suite and wondering about...', body: 'Hello, I am currently checked in to the Presidential Suite and having a wonderful stay. I was wondering if there are any special packages for extending my stay by two additional nights? Also, is the spa open on Sundays?', time: new Date(now - 12 * 3600000).toISOString(), read: true },
            { id: 6,  sender: 'Olivia Bennett',      subject: 'Romantic Dinner Arrangement',   preview: 'My partner and I would love a private lakeside dinner setup...', body: 'Hi there! My partner and I are celebrating our anniversary. Would it be possible to arrange a private candlelit dinner by the lake on March 1st? We would love a special menu with champagne. Budget is flexible.', time: new Date(now - 18 * 3600000).toISOString(), read: false },
            { id: 7,  sender: 'Ahmed Al-Rashid',     subject: 'Prayer Room Facilities',        preview: 'Does the hotel have a quiet space that can be used for prayer?', body: 'Assalamu alaikum, I will be staying from Feb 27. Does the hotel have a designated prayer room or a quiet space that could be used for prayers? Also, are there halal dining options available? Jazakallah khair.', time: new Date(now - 24 * 3600000).toISOString(), read: true },
            { id: 8,  sender: 'Yuki Tanaka',         subject: 'Booking Confirmation Query',    preview: 'I have not received my confirmation email for booking #12...', body: 'Hello, I made a booking for March 5-8 in the Presidential Suite but have not received a confirmation email. Could you please verify my reservation and resend the confirmation? My email is y.tanaka@email.com. Thank you.', time: new Date(now - 36 * 3600000).toISOString(), read: false },
            { id: 9,  sender: 'Grace Nakamya',       subject: 'Wedding Venue Inquiry',         preview: 'We are considering your hotel for our wedding reception in April...', body: 'Dear events team, my fiance and I are planning our wedding reception for April 2026 and we love the lakeside setting. Could you share information about your wedding packages, capacity, and available dates in April? We expect about 150 guests.', time: new Date(now - 48 * 3600000).toISOString(), read: true },
            { id: 10, sender: 'David Ochieng',       subject: 'Group Booking Discount',        preview: 'Our company would like to book 5 rooms for a team retreat...', body: 'Hi, I am organising a corporate retreat for our team of 10 people. We would need 5 rooms (mix of Executive King and Executive Twin) from March 3-5. Do you offer group discounts? We would also need a meeting room for one day.', time: new Date(now - 72 * 3600000).toISOString(), read: true }
        ];

        // Occupancy history (30 days, with weekend peaks)
        const occupancy = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dayOfWeek = d.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
            const base = isWeekend ? 72 : 52;
            const variance = Math.floor(Math.random() * 20) - 8;
            const rate = Math.min(100, Math.max(30, base + variance));
            occupancy.push({
                date: d.toISOString().split('T')[0],
                rate: rate
            });
        }

        // Revenue history (30 days)
        const revenue = occupancy.map(day => {
            const occupiedRooms = Math.round((day.rate / 100) * 20);
            const avgPrice = 175 + Math.floor(Math.random() * 40) - 20;
            return {
                date: day.date,
                amount: occupiedRooms * avgPrice
            };
        });

        // Room rates (editable per type)
        const rates = {};
        ROOM_TYPES.forEach(t => { rates[t] = ROOM_PRICES[t]; });

        // Blocked dates per room type (empty = fully available)
        const blocked = {};
        ROOM_TYPES.forEach(t => { blocked[t] = []; });

        // Room content (images, descriptions, features)
        const content = {};
        ROOM_TYPES.forEach(t => { content[t] = Object.assign({}, DEFAULT_CONTENT[t]); });

        var heroSlides = [
            { id: 'slide1', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80', label: 'Welcome to', heading: 'Lake Victoria Hotel', subtitle: 'We Speak Your Language', buttonText: 'Book Now', buttonLink: 'bookings.html' },
            { id: 'slide2', image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1600&q=80', label: 'Each Hotel Room is', heading: 'Unique...Just Like You', subtitle: 'Experience comfort and elegance in every stay', buttonText: 'Explore Rooms', buttonLink: 'bookings.html' },
            { id: 'slide3', image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1600&q=80', label: 'Let Your Events', heading: 'Shine...Just Like You', subtitle: 'Host memorable events at our world-class venue', buttonText: 'Contact Us', buttonLink: 'contact.html' }
        ];

        var newsFeeds = [
            { id: 'nf1', image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80', title: 'Lake Victoria Hotel Wins Best Hospitality Award 2026', excerpt: 'We are proud to announce that Lake Victoria Hotel has been recognised as the Best Hospitality Establishment in East Africa at the 2026 Tourism Excellence Awards.', date: '2026-02-28', category: 'Awards' },
            { id: 'nf2', image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80', title: 'Live Jazz Nights Every Friday at The Lakeview Bar', excerpt: 'Join us every Friday evening for live jazz performances by top Ugandan artists. Enjoy craft cocktails and stunning sunset views over Lake Victoria.', date: '2026-02-25', category: 'Events' },
            { id: 'nf3', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80', title: 'New Lakeside Wedding Packages Now Available', excerpt: 'Say "I do" on the shores of Lake Victoria. Our new all-inclusive wedding packages feature elegant lakeside ceremonies, gourmet dining, and luxury accommodation.', date: '2026-02-20', category: 'Offers' }
        ];

        var facilities = [
            { id: 'fac1', tag: 'Relax',   title: 'Pool & Spa',        description: 'Relax and unwind at our stunning outdoor pool overlooking Lake Victoria. Our spa offers a full menu of massages, facials and holistic treatments.', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80', link: 'contact.html', linkText: 'Enquire' },
            { id: 'fac2', tag: 'Active',  title: 'Fitness Center',    description: 'Stay at the top of your game with our fully equipped gym featuring cardio machines, free weights, and daily group fitness classes.', image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&q=80', link: 'contact.html', linkText: 'Enquire' },
            { id: 'fac3', tag: 'Dine',    title: 'Restaurant & Bar',  description: 'Savour international buffet dining, local Ugandan specialties, and fine cocktails with panoramic lake views at our acclaimed restaurant.', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80', link: 'dining.html', linkText: 'View Menu' },
            { id: 'fac4', tag: 'Explore', title: 'Outdoors',          description: 'Discover the natural beauty of Lake Victoria with guided boat tours, lakeside walks, and sunset viewing from our private sun terrace.', image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&q=80', link: 'contact.html', linkText: 'Enquire' }
        ];

        var packages = [
            { id: 'pkg1', badge: 'Popular', title: 'Romantic Getaway',  description: 'Two nights in a Lake View Suite, candlelit dinner, couples spa treatment, and a private boat sunset cruise.', image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80', includes: ['Lake View Suite (2 nights)', 'Daily breakfast & dinner', 'Couples spa session', 'Sunset boat cruise'] },
            { id: 'pkg2', badge: '',        title: 'Business & Events', description: 'Conference facilities, executive accommodation, team dining, and full AV support for productive business events.', image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=80', includes: ['Executive King Room', 'Conference hall access', 'Full AV equipment', 'Catering & refreshments'] },
            { id: 'pkg3', badge: '',        title: 'Family Holiday',    description: 'Spacious family room, kids\' activities, family dining, pool access and a guided Entebbe wildlife experience.', image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&q=80', includes: ['Family Room (3 nights)', 'Daily breakfast', 'Pool & kids activities', 'Wildlife day trip'] }
        ];

        var managementTeam = [
            { id: 'mgmt1', name: 'David Ssekabira',     role: 'General Manager',         bio: 'With over 20 years in luxury hospitality, David leads our team with passion and a commitment to world-class service.', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80' },
            { id: 'mgmt2', name: 'Grace Namukasa',       role: 'Operations Manager',      bio: 'Grace ensures every department operates seamlessly, delivering the flawless experiences our guests expect.', image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80' },
            { id: 'mgmt3', name: 'Chef Emmanuel Otieno', role: 'Executive Head Chef',     bio: 'Chef Emmanuel brings international culinary expertise and a deep love of Ugandan flavours to every dish.', image: 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=400&q=80' },
            { id: 'mgmt4', name: 'Aisha Nakato',         role: 'Guest Relations Manager', bio: 'Aisha is dedicated to ensuring every guest feels welcomed, valued, and truly at home from first contact.', image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&q=80' }
        ];

        var surroundings = [
            { id: 'sur1', icon: 'fa-paw',          title: 'Uganda Wildlife Education Centre', description: 'Home to Uganda\'s zoo and wildlife sanctuary — a world-class nature experience minutes away.' },
            { id: 'sur2', icon: 'fa-plane',         title: 'Entebbe International Airport',    description: 'Only 3.1 km from the airport — the most convenient hotel for arrivals, departures and layovers.' },
            { id: 'sur3', icon: 'fa-water',         title: 'Lake Victoria',                    description: 'Africa\'s largest freshwater lake — beaches, marine life and stunning sunsets right on your doorstep.' },
            { id: 'sur4', icon: 'fa-flag',          title: 'State House',                      description: 'The official residence of the President of Uganda is situated nearby, in one of Entebbe\'s most secure areas.' },
            { id: 'sur5', icon: 'fa-leaf',          title: 'Botanical Gardens',                description: 'Entebbe\'s famous botanical gardens — ideal for nature walks, bird watching and scenic relaxation.' },
            { id: 'sur6', icon: 'fa-globe-africa',  title: 'UN African Regional Centre',       description: 'The UN African Regional Centre is just 2 km away, making us the preferred choice for international delegates.' },
            { id: 'sur7', icon: 'fa-golf-ball',     title: 'Golf Course',                      description: 'A world-class golf course sits just metres from our main gate — perfect for leisure and corporate outings.' },
            { id: 'sur8', icon: 'fa-church',        title: 'Kigungu Missionary Site',          description: 'The historic site where the first missionaries arrived by water — a landmark of Uganda\'s cultural heritage.' }
        ];

        return { bookings, rooms, messages, occupancy, revenue, rates, blocked, content, roomNames: {}, auditLog: [], guestRating: { average: 0, count: 0 }, extraAdultFee: 30, childFee: 30, childChargeAge: 10, customRooms: [], heroSlides: heroSlides, newsFeeds: newsFeeds, facilities: facilities, packages: packages, managementTeam: managementTeam, surroundings: surroundings, menuFiles: { food: null, drinks: null, snacks: null, desserts: null, mains: null, starters: null } };
    }

    function migrateData(data) {
        if (!data.rates) {
            data.rates = {};
            ROOM_TYPES.forEach(t => { data.rates[t] = ROOM_PRICES[t]; });
        }
        if (!data.blocked) {
            data.blocked = {};
            ROOM_TYPES.forEach(t => { data.blocked[t] = []; });
        }
        if (!data.content) {
            data.content = {};
            ROOM_TYPES.forEach(t => { data.content[t] = Object.assign({}, DEFAULT_CONTENT[t]); });
        }
        if (!data.roomNames) {
            data.roomNames = {};
        }
        if (!data.auditLog) {
            data.auditLog = [];
        }
        if (!data.guestRating) {
            data.guestRating = { average: 0, count: 0 };
        }
        if (!data.extraAdultFee) {
            data.extraAdultFee = 30;
        }
        if (!data.childFee) {
            data.childFee = 30;
        }
        if (!data.childChargeAge) {
            data.childChargeAge = 10;
        }
        if (!data.customRooms) {
            data.customRooms = [];
        }
        if (!data.heroSlides) {
            data.heroSlides = [
                { id: 'slide1', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80', label: 'Welcome to', heading: 'Lake Victoria Hotel', subtitle: 'We Speak Your Language', buttonText: 'Book Now', buttonLink: 'bookings.html' },
                { id: 'slide2', image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1600&q=80', label: 'Each Hotel Room is', heading: 'Unique...Just Like You', subtitle: 'Experience comfort and elegance in every stay', buttonText: 'Explore Rooms', buttonLink: 'bookings.html' },
                { id: 'slide3', image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1600&q=80', label: 'Let Your Events', heading: 'Shine...Just Like You', subtitle: 'Host memorable events at our world-class venue', buttonText: 'Contact Us', buttonLink: 'contact.html' }
            ];
        }
        if (!data.newsFeeds) {
            data.newsFeeds = [
                { id: 'nf1', image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80', title: 'Lake Victoria Hotel Wins Best Hospitality Award 2026', excerpt: 'We are proud to announce that Lake Victoria Hotel has been recognised as the Best Hospitality Establishment in East Africa at the 2026 Tourism Excellence Awards.', date: '2026-02-28', category: 'Awards' },
                { id: 'nf2', image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80', title: 'Live Jazz Nights Every Friday at The Lakeview Bar', excerpt: 'Join us every Friday evening for live jazz performances by top Ugandan artists. Enjoy craft cocktails and stunning sunset views over Lake Victoria.', date: '2026-02-25', category: 'Events' },
                { id: 'nf3', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80', title: 'New Lakeside Wedding Packages Now Available', excerpt: 'Say "I do" on the shores of Lake Victoria. Our new all-inclusive wedding packages feature elegant lakeside ceremonies, gourmet dining, and luxury accommodation.', date: '2026-02-20', category: 'Offers' }
            ];
        }
        if (!data.facilities || !data.facilities.length) {
            data.facilities = [
                { id: 'fac1', tag: 'Relax',   title: 'Pool & Spa',        description: 'Relax and unwind at our stunning outdoor pool overlooking Lake Victoria. Our spa offers a full menu of massages, facials and holistic treatments.', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80', link: 'contact.html', linkText: 'Enquire' },
                { id: 'fac2', tag: 'Active',  title: 'Fitness Center',    description: 'Stay at the top of your game with our fully equipped gym featuring cardio machines, free weights, and daily group fitness classes.', image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&q=80', link: 'contact.html', linkText: 'Enquire' },
                { id: 'fac3', tag: 'Dine',    title: 'Restaurant & Bar',  description: 'Savour international buffet dining, local Ugandan specialties, and fine cocktails with panoramic lake views at our acclaimed restaurant.', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80', link: 'dining.html', linkText: 'View Menu' },
                { id: 'fac4', tag: 'Explore', title: 'Outdoors',          description: 'Discover the natural beauty of Lake Victoria with guided boat tours, lakeside walks, and sunset viewing from our private sun terrace.', image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&q=80', link: 'contact.html', linkText: 'Enquire' }
            ];
        }
        if (!data.packages || !data.packages.length) {
            data.packages = [
                { id: 'pkg1', badge: 'Popular', title: 'Romantic Getaway',  description: 'Two nights in a Lake View Suite, candlelit dinner, couples spa treatment, and a private boat sunset cruise.', image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80', includes: ['Lake View Suite (2 nights)', 'Daily breakfast & dinner', 'Couples spa session', 'Sunset boat cruise'] },
                { id: 'pkg2', badge: '',        title: 'Business & Events', description: 'Conference facilities, executive accommodation, team dining, and full AV support for productive business events.', image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=80', includes: ['Executive King Room', 'Conference hall access', 'Full AV equipment', 'Catering & refreshments'] },
                { id: 'pkg3', badge: '',        title: 'Family Holiday',    description: 'Spacious family room, kids\' activities, family dining, pool access and a guided Entebbe wildlife experience.', image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&q=80', includes: ['Family Room (3 nights)', 'Daily breakfast', 'Pool & kids activities', 'Wildlife day trip'] }
            ];
        }
        if (!data.managementTeam || !data.managementTeam.length) {
            data.managementTeam = [
                { id: 'mgmt1', name: 'David Ssekabira',     role: 'General Manager',         bio: 'With over 20 years in luxury hospitality, David leads our team with passion and a commitment to world-class service.', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80' },
                { id: 'mgmt2', name: 'Grace Namukasa',       role: 'Operations Manager',      bio: 'Grace ensures every department operates seamlessly, delivering the flawless experiences our guests expect.', image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80' },
                { id: 'mgmt3', name: 'Chef Emmanuel Otieno', role: 'Executive Head Chef',     bio: 'Chef Emmanuel brings international culinary expertise and a deep love of Ugandan flavours to every dish.', image: 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=400&q=80' },
                { id: 'mgmt4', name: 'Aisha Nakato',         role: 'Guest Relations Manager', bio: 'Aisha is dedicated to ensuring every guest feels welcomed, valued, and truly at home from first contact.', image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&q=80' }
            ];
        }
        if (!data.surroundings || !data.surroundings.length) {
            data.surroundings = [
                { id: 'sur1', icon: 'fa-paw',          title: 'Uganda Wildlife Education Centre', description: 'Home to Uganda\'s zoo and wildlife sanctuary — a world-class nature experience minutes away.' },
                { id: 'sur2', icon: 'fa-plane',         title: 'Entebbe International Airport',    description: 'Only 3.1 km from the airport — the most convenient hotel for arrivals, departures and layovers.' },
                { id: 'sur3', icon: 'fa-water',         title: 'Lake Victoria',                    description: 'Africa\'s largest freshwater lake — beaches, marine life and stunning sunsets right on your doorstep.' },
                { id: 'sur4', icon: 'fa-flag',          title: 'State House',                      description: 'The official residence of the President of Uganda is situated nearby, in one of Entebbe\'s most secure areas.' },
                { id: 'sur5', icon: 'fa-leaf',          title: 'Botanical Gardens',                description: 'Entebbe\'s famous botanical gardens — ideal for nature walks, bird watching and scenic relaxation.' },
                { id: 'sur6', icon: 'fa-globe-africa',  title: 'UN African Regional Centre',       description: 'The UN African Regional Centre is just 2 km away, making us the preferred choice for international delegates.' },
                { id: 'sur7', icon: 'fa-golf-ball',     title: 'Golf Course',                      description: 'A world-class golf course sits just metres from our main gate — perfect for leisure and corporate outings.' },
                { id: 'sur8', icon: 'fa-church',        title: 'Kigungu Missionary Site',          description: 'The historic site where the first missionaries arrived by water — a landmark of Uganda\'s cultural heritage.' }
            ];
        }
        if (!data.menuFiles) {
            data.menuFiles = { food: null, drinks: null, snacks: null, desserts: null, mains: null, starters: null };
        }
        // Ensure messages array exists (safety net for legacy data)
        if (!data.messages) data.messages = [];
        // Migrate existing messages: add testimonial fields if missing
        data.messages.forEach(function (m) {
            if (m.showOnHomepage === undefined) m.showOnHomepage = false;
            if (m._country === undefined) m._country = '';
        });
        // Ensure custom rooms have entries in rates/blocked/content
        data.customRooms.forEach(function (r) {
            if (data.rates && !data.rates[r.key]) data.rates[r.key] = r.defaultRate || 100;
            if (data.blocked && !data.blocked[r.key]) data.blocked[r.key] = [];
            if (data.content && !data.content[r.key]) {
                data.content[r.key] = {
                    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&q=80',
                    description: r.key + ' — a comfortable and elegant room.',
                    bedType: 'Double Bed', roomSize: '30 m²', maxGuests: '2 Guests'
                };
            }
        });
        return data;
    }

    function loadData() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                _dataSource = 'localStorage';
                return migrateData(JSON.parse(stored));
            }
            catch (e) { /* fall through to regenerate */ }
        }
        _dataSource = 'generated';
        const data = generateSeedData();

        // Merge saved messages from site-config.js (rated feedback, featured testimonials)
        var cfg = (typeof LVH_SITE_CONFIG !== 'undefined') ? LVH_SITE_CONFIG : {};
        if (cfg.messages && cfg.messages.length) {
            var existingIds = {};
            data.messages.forEach(function (m) { existingIds[m.id] = true; });
            cfg.messages.forEach(function (m) {
                if (!existingIds[m.id]) {
                    data.messages.push(m);
                    existingIds[m.id] = true;
                }
            });
            data.messages.sort(function (a, b) { return new Date(b.time) - new Date(a.time); });
        }
        // Apply file-based config overrides
        if (cfg.rates) data.rates = cfg.rates;
        if (cfg.roomNames && Object.keys(cfg.roomNames).length) data.roomNames = cfg.roomNames;
        if (cfg.blocked && Object.keys(cfg.blocked).length) data.blocked = cfg.blocked;
        if (cfg.content && Object.keys(cfg.content).length) data.content = cfg.content;
        if (cfg.heroSlides && cfg.heroSlides.length) data.heroSlides = cfg.heroSlides;
        if (cfg.newsFeeds && cfg.newsFeeds.length) data.newsFeeds = cfg.newsFeeds;
        if (cfg.customRooms && cfg.customRooms.length) data.customRooms = cfg.customRooms;
        if (cfg.extraAdultFee)  data.extraAdultFee  = cfg.extraAdultFee;
        if (cfg.childChargeAge) data.childChargeAge = cfg.childChargeAge;
        if (cfg.childFee)       data.childFee       = cfg.childFee;
        if (cfg.guestRating && cfg.guestRating.count > 0) data.guestRating = cfg.guestRating;

        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return data;
    }

    var LAST_CHANGE_KEY  = 'lvh_last_change';
    var LAST_FILESAVE_KEY = 'lvh_last_filesave';

    function saveData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(LAST_CHANGE_KEY, Date.now().toString());
        idbSave(data); // backup to IndexedDB
        updateUnsavedBanner();
    }

    function markFileSaved() {
        localStorage.setItem(LAST_FILESAVE_KEY, Date.now().toString());
        updateUnsavedBanner();
    }

    function hasUnsavedChanges() {
        var lastChange  = parseInt(localStorage.getItem(LAST_CHANGE_KEY)  || '0', 10);
        var lastFileSave = parseInt(localStorage.getItem(LAST_FILESAVE_KEY) || '0', 10);
        return lastChange > lastFileSave;
    }

    function updateUnsavedBanner() {
        var banner = document.getElementById('dbUnsavedBanner');
        if (!banner) return;
        if (hasUnsavedChanges()) {
            banner.style.display = 'flex';
        } else {
            banner.style.display = 'none';
        }
    }

    let DATA = loadData();

    /* --- Import guest feedback from public site --- */
    var LVH_FEEDBACK_KEY = 'lvh_feedback';

    function importFeedback() {
        if (!DATA.messages) DATA.messages = [];
        var changed = false;

        // --- Path A: Re-read localStorage for direct-written feedback ---
        // (main.js writes feedback directly into lvh_dashboard messages;
        //  if the dashboard page was already open, DATA in memory is stale)
        try {
            var freshStore = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
            if (freshStore && freshStore.messages && freshStore.messages.length) {
                var existingFbIds = {};
                DATA.messages.forEach(function (m) { if (m._feedbackId) existingFbIds[m._feedbackId] = true; });

                freshStore.messages.forEach(function (m) {
                    if (m._type === 'feedback' && m._feedbackId && !existingFbIds[m._feedbackId]) {
                        DATA.messages.unshift(m);
                        existingFbIds[m._feedbackId] = true;
                        changed = true;
                    }
                });
            }
        } catch (e) { /* parse error */ }

        // --- Path B: Import from lvh_feedback backup queue ---
        var raw;
        try { raw = JSON.parse(localStorage.getItem(LVH_FEEDBACK_KEY) || '[]'); } catch (e) { raw = []; }

        if (raw.length) {
            var existingIds = {};
            DATA.messages.forEach(function (m) { if (m._feedbackId) existingIds[m._feedbackId] = true; });

            var nextId = DATA.messages.reduce(function (mx, m) { return Math.max(mx, m.id || 0); }, 0) + 1;

            raw.forEach(function (entry) {
                if (existingIds[entry.id]) return;

                var stars = '';
                for (var s = 1; s <= 5; s++) stars += (s <= entry.rating ? '\u2605' : '\u2606');

                var body = entry.message +
                    '\n\nRating: ' + stars + ' (' + entry.rating + '/5)' +
                    (entry.email ? '\nEmail: ' + entry.email : '') +
                    '\nPage: ' + entry.page;

                DATA.messages.unshift({
                    id: nextId++,
                    sender: entry.name,
                    subject: 'Guest Feedback \u2014 ' + entry.rating + '\u2605',
                    preview: entry.message.substring(0, 80) + (entry.message.length > 80 ? '...' : ''),
                    body: body,
                    time: entry.timestamp,
                    read: false,
                    _feedbackId: entry.id,
                    _rating: entry.rating,
                    _type: 'feedback',
                    showOnHomepage: false,
                    _country: ''
                });

                existingIds[entry.id] = true;
                changed = true;
            });
        }

        if (changed) {
            // Sort messages by time descending
            DATA.messages.sort(function (a, b) { return new Date(b.time) - new Date(a.time); });
            saveData(DATA);
        }
    }

    // Async: attempt IndexedDB recovery if localStorage was empty
    (function tryIDBRecovery() {
        var hadLocalStorage = !!localStorage.getItem(STORAGE_KEY + '_existed');
        // If loadData fell through to generateSeedData, try to recover from IndexedDB
        if (_dataSource === 'generated') {
            idbLoad().then(function (backup) {
                if (backup && backup.rates) {
                    // Recovered from IndexedDB — restore it
                    DATA = migrateData(backup);
                    saveData(DATA);
                    _dataSource = 'indexedDB';
                    // Re-render current view
                    renderOverview();
                    showRecoveryToast();
                }
            });
        } else {
            // Mark that localStorage had data (so we know if it disappears later)
            localStorage.setItem(STORAGE_KEY + '_existed', '1');
            // Keep IndexedDB in sync
            idbSave(DATA);
        }
    })();


    /* =============================================
       NAVIGATION — SPA section switching
       ============================================= */
    const navItems = document.querySelectorAll('.db-nav-item, .db-nav-link');
    const sections = document.querySelectorAll('.db-section');
    const sidebar  = document.getElementById('dbSidebar');
    const overlay  = document.getElementById('dbSidebarOverlay');
    const menuBtn  = document.getElementById('dbMenuToggle');

    function switchSection(name) {
        sections.forEach(s => s.classList.remove('active'));
        const target = document.getElementById('sec-' + name);
        if (target) target.classList.add('active');

        document.querySelectorAll('.db-nav-item').forEach(n => {
            n.classList.toggle('active', n.dataset.section === name);
        });

        // Close mobile sidebar
        closeSidebar();

        // Re-render section
        if (name === 'overview')  renderOverview();
        if (name === 'rooms')     renderRooms();
        if (name === 'messages')  renderMessages();
        if (name === 'analytics') renderAnalytics();
        if (name === 'audit')     renderAuditSection();
        if (name === 'reports')   renderReports();
        if (name === 'homepage')  { renderHomepage(); renderNewsFeedManager(); }
        if (name === 'offers')    renderOffersPage();
        if (name === 'about')     renderAboutPage();
        if (name === 'dining')    renderDiningPage();
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (item.dataset.section) switchSection(item.dataset.section);
        });
    });

    // Mobile sidebar toggle
    function openSidebar() {
        sidebar && sidebar.classList.add('open');
        overlay && overlay.classList.add('active');
    }

    function closeSidebar() {
        sidebar && sidebar.classList.remove('open');
        overlay && overlay.classList.remove('active');
    }

    menuBtn  && menuBtn.addEventListener('click', openSidebar);
    overlay  && overlay.addEventListener('click', closeSidebar);


    /* =============================================
       RENDERING — Overview
       ============================================= */
    // Helper: count nights a booking overlaps with a date range [rangeStart, rangeEnd)
    function overlapNights(checkin, checkout, rangeStart, rangeEnd) {
        var a = checkin > rangeStart ? checkin : rangeStart;
        var b = checkout < rangeEnd ? checkout : rangeEnd;
        var diff = Math.round((new Date(b) - new Date(a)) / 86400000);
        return diff > 0 ? diff : 0;
    }

    // Helper: check if a booking is active on a given date string (YYYY-MM-DD)
    function isBookingActiveOn(b, dateStr) {
        return b.status !== 'cancelled' && b.checkin <= dateStr && b.checkout > dateStr;
    }

    /* --- Country flag emoji helper --- */
    var COUNTRY_FLAGS = {
        'Uganda': '\ud83c\uddfa\ud83c\uddec', 'Kenya': '\ud83c\uddf0\ud83c\uddea', 'UK': '\ud83c\uddec\ud83c\udde7',
        'United Kingdom': '\ud83c\uddec\ud83c\udde7', 'USA': '\ud83c\uddfa\ud83c\uddf8', 'United States': '\ud83c\uddfa\ud83c\uddf8',
        'Germany': '\ud83c\udde9\ud83c\uddea', 'Tanzania': '\ud83c\uddf9\ud83c\uddff', 'Rwanda': '\ud83c\uddf7\ud83c\uddfc',
        'South Africa': '\ud83c\uddff\ud83c\udde6', 'India': '\ud83c\uddee\ud83c\uddf3', 'France': '\ud83c\uddeb\ud83c\uddf7',
        'Canada': '\ud83c\udde8\ud83c\udde6', 'Australia': '\ud83c\udde6\ud83c\uddfa', 'Netherlands': '\ud83c\uddf3\ud83c\uddf1',
        'Italy': '\ud83c\uddee\ud83c\uddf9', 'Spain': '\ud83c\uddea\ud83c\uddf8', 'China': '\ud83c\udde8\ud83c\uddf3',
        'Japan': '\ud83c\uddef\ud83c\uddf5', 'Brazil': '\ud83c\udde7\ud83c\uddf7', 'Nigeria': '\ud83c\uddf3\ud83c\uddec',
        'Ethiopia': '\ud83c\uddea\ud83c\uddf9', 'Egypt': '\ud83c\uddea\ud83c\uddec', 'Ghana': '\ud83c\uddec\ud83c\udded',
        'Congo': '\ud83c\udde8\ud83c\udde9', 'Sweden': '\ud83c\uddf8\ud83c\uddea', 'Norway': '\ud83c\uddf3\ud83c\uddf4',
        'Denmark': '\ud83c\udde9\ud83c\uddf0', 'Belgium': '\ud83c\udde7\ud83c\uddea', 'Switzerland': '\ud83c\udde8\ud83c\udded',
        'Austria': '\ud83c\udde6\ud83c\uddf9', 'Poland': '\ud83c\uddf5\ud83c\uddf1', 'Russia': '\ud83c\uddf7\ud83c\uddfa',
        'Turkey': '\ud83c\uddf9\ud83c\uddf7', 'Saudi Arabia': '\ud83c\uddf8\ud83c\udde6', 'United Arab Emirates': '\ud83c\udde6\ud83c\uddea',
        'Israel': '\ud83c\uddee\ud83c\uddf1', 'Pakistan': '\ud83c\uddf5\ud83c\uddf0', 'Bangladesh': '\ud83c\udde7\ud83c\udde9',
        'South Korea': '\ud83c\uddf0\ud83c\uddf7', 'Mexico': '\ud83c\uddf2\ud83c\uddfd', 'Argentina': '\ud83c\udde6\ud83c\uddf7',
        'Colombia': '\ud83c\udde8\ud83c\uddf4', 'Thailand': '\ud83c\uddf9\ud83c\udded', 'Indonesia': '\ud83c\uddee\ud83c\udde9',
        'Philippines': '\ud83c\uddf5\ud83c\udded', 'Malaysia': '\ud83c\uddf2\ud83c\uddfe', 'Singapore': '\ud83c\uddf8\ud83c\uddec',
        'New Zealand': '\ud83c\uddf3\ud83c\uddff', 'Portugal': '\ud83c\uddf5\ud83c\uddf9', 'Ireland': '\ud83c\uddee\ud83c\uddea',
        'Burundi': '\ud83c\udde7\ud83c\uddee', 'Mozambique': '\ud83c\uddf2\ud83c\uddff', 'Zimbabwe': '\ud83c\uddff\ud83c\uddfc',
        'Zambia': '\ud83c\uddff\ud83c\uddf2', 'Malawi': '\ud83c\uddf2\ud83c\uddfc', 'Sudan': '\ud83c\uddf8\ud83c\udde9',
        'Somalia': '\ud83c\uddf8\ud83c\uddf4', 'Cameroon': '\ud83c\udde8\ud83c\uddf2', 'Senegal': '\ud83c\uddf8\ud83c\uddf3'
    };

    let overviewDateRange = '30';

    function renderOverview() {
        importFeedback();
        // Date
        const dateEl = document.getElementById('dbDateDisplay');
        const now = new Date();
        if (dateEl) {
            const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            dateEl.textContent = now.toLocaleDateString('en-US', opts);
        }

        // Sidebar badges
        const unread = DATA.messages.filter(m => !m.read).length;
        setTextById('dbUnreadCount', unread);

        // Load site analytics and filter by selected range
        var allEvents = loadSiteAnalytics();
        var events = filterEventsByRange(allEvents, overviewDateRange);
        var counts = { page_view: 0, room_book_click: 0, booking_confirmed: 0, availability_check: 0, contact_enquiry: 0, pdf_download: 0 };
        events.forEach(function (e) { if (counts[e.event] !== undefined) counts[e.event]++; });

        // --- Row 1: 6 Stat Cards ---
        setTextById('statSiteVisits', counts.page_view);
        setTextById('statBookClicks', counts.room_book_click);
        setTextById('statEmailsSent', counts.booking_confirmed);
        setTextById('statAvailChecks', counts.availability_check);
        setTextById('statEnquiries', counts.contact_enquiry);

        // Guest rating — always all-time (derived from actual feedback messages)
        var feedbackMsgs = DATA.messages.filter(function (m) { return m._type === 'feedback' && m._rating; });
        var fbCount = feedbackMsgs.length;
        var fbAvg = fbCount > 0 ? feedbackMsgs.reduce(function (sum, m) { return sum + m._rating; }, 0) / fbCount : 0;
        fbAvg = Math.round(fbAvg * 10) / 10;
        DATA.guestRating = { average: fbAvg, count: fbCount };

        setTextById('statGuestRating', fbCount > 0 ? fbAvg.toFixed(1) + ' / 5' : '— / 5');
        var starsEl = document.getElementById('dbRatingStars');
        if (starsEl) {
            var starsHtml = '';
            if (fbCount > 0) {
                for (var s = 1; s <= 5; s++) {
                    if (s <= Math.floor(fbAvg)) {
                        starsHtml += '<i class="fas fa-star"></i>';
                    } else if (s - fbAvg < 1 && s - fbAvg > 0) {
                        starsHtml += '<i class="fas fa-star-half-alt"></i>';
                    } else {
                        starsHtml += '<i class="far fa-star"></i>';
                    }
                }
                starsHtml += '<span class="db-rating-count">(' + fbCount + ' review' + (fbCount !== 1 ? 's' : '') + ')</span>';
            } else {
                for (var s = 1; s <= 5; s++) starsHtml += '<i class="far fa-star"></i>';
                starsHtml += '<span class="db-rating-count">No reviews yet</span>';
            }
            starsEl.innerHTML = starsHtml;
        }

        // --- Row 2: Site Activity Chart ---
        var chartDays = overviewDateRange === 'all' ? 30 : (overviewDateRange === 'month' ? Math.ceil((now - new Date(now.getFullYear(), now.getMonth(), 1)) / 86400000) + 1 : parseInt(overviewDateRange));
        renderOverviewActivityChart(chartDays);

        // --- Row 2: Top Pages Donut ---
        renderTopPagesDonut(events);

        // --- Row 3: Visitor Locations ---
        renderVisitorLocations(events);

        // --- Row 3: Recent Activity ---
        renderRecentActivity(events);

        // Attach section-level date filter
        attachOverviewFilter();
    }

    function attachOverviewFilter() {
        var filterBar = document.getElementById('dbOverviewDateFilter');
        if (!filterBar || filterBar._bound) return;
        filterBar._bound = true;
        var pills = filterBar.querySelectorAll('.db-pill');
        pills.forEach(function (pill) {
            pill.addEventListener('click', function () {
                pills.forEach(function (b) { b.classList.remove('active'); });
                pill.classList.add('active');
                overviewDateRange = pill.dataset.range;
                renderOverview();
            });
        });
    }

    function renderOverviewActivityChart(numDays) {
        var events = loadSiteAnalytics();
        var now = new Date();
        var days = [];
        for (var i = numDays - 1; i >= 0; i--) {
            var d = new Date(now);
            d.setDate(d.getDate() - i);
            var dateStr = d.toISOString().split('T')[0];
            var count = events.filter(function (e) { return e.timestamp && e.timestamp.split('T')[0] === dateStr; }).length;
            days.push({ date: dateStr, count: count });
        }
        drawLineChart(
            'dbOverviewActivityChart',
            days,
            function (d) { var dt = new Date(d.date); return (dt.getMonth() + 1) + '/' + dt.getDate(); },
            function (d) { return d.count; },
            '',
            '#2c6e49'
        );
    }

    function renderTopPagesDonut(events) {
        var donut = document.getElementById('dbOverviewDonut');
        var legend = document.getElementById('dbOverviewDonutLegend');
        var totalEl = document.getElementById('dbOverviewDonutTotal');
        if (!donut) return;

        // Group page_view events by page
        var pageViews = events.filter(function (e) { return e.event === 'page_view'; });
        var pageCounts = {};
        pageViews.forEach(function (e) {
            var page = e.page || 'index.html';
            pageCounts[page] = (pageCounts[page] || 0) + 1;
        });

        var total = pageViews.length;
        if (totalEl) totalEl.textContent = total;

        var entries = Object.entries(pageCounts).sort(function (a, b) { return b[1] - a[1]; });
        var palette = ['#2c6e49', '#c9a84c', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6', '#f59e0b'];

        if (entries.length === 0) {
            donut.style.background = 'var(--db-bg)';
            if (legend) legend.innerHTML = '<div style="color:var(--db-text-light);font-size:0.82rem">No page views yet</div>';
            return;
        }

        var offset = 0;
        var segments = [];
        entries.forEach(function (entry, i) {
            var pct = (entry[1] / total) * 100;
            var color = palette[i % palette.length];
            segments.push(color + ' ' + offset + '% ' + (offset + pct) + '%');
            offset += pct;
        });

        donut.style.background = 'conic-gradient(' + segments.join(', ') + ')';

        if (legend) {
            legend.innerHTML = entries.slice(0, 7).map(function (entry, i) {
                var pageName = entry[0].replace('.html', '');
                pageName = pageName.charAt(0).toUpperCase() + pageName.slice(1);
                return '<div class="db-legend-item">' +
                    '<span class="db-legend-dot" style="background:' + palette[i % palette.length] + '"></span>' +
                    pageName + ' (' + entry[1] + ')' +
                '</div>';
            }).join('');
        }
    }

    function renderVisitorLocations(events) {
        var container = document.getElementById('dbVisitorLocations');
        if (!container) return;

        // Group by IP address — each unique IP is one visitor
        var ipMap = {}; // ip → { country, city, visits }
        events.forEach(function (e) {
            if (!e.ip) return;
            if (!ipMap[e.ip]) {
                ipMap[e.ip] = { country: e.country || '', city: e.city || '', visits: 0 };
            }
            ipMap[e.ip].visits++;
            // Keep the most recent country/city in case it was patched later
            if (e.country) ipMap[e.ip].country = e.country;
            if (e.city)    ipMap[e.ip].city    = e.city;
        });

        var entries = Object.entries(ipMap).sort(function (a, b) { return b[1].visits - a[1].visits; });

        if (entries.length === 0) {
            container.innerHTML = '<div class="db-empty" style="padding:20px 0">No visitor IP data yet — requires HTTP/HTTPS (not file://)</div>';
            return;
        }

        var maxVisits = entries[0][1].visits;

        // Table header
        var html = '<table class="db-ip-table">' +
            '<thead><tr>' +
                '<th>IP Address</th>' +
                '<th>Location</th>' +
                '<th style="text-align:right">Visits</th>' +
            '</tr></thead>' +
            '<tbody>';

        entries.slice(0, 15).forEach(function (entry) {
            var ip   = entry[0];
            var info = entry[1];
            var flag = COUNTRY_FLAGS[info.country] || '\ud83c\udf10';
            var location = [info.city, info.country].filter(Boolean).join(', ') || 'Unknown';
            var barWidth = maxVisits > 0 ? Math.round((info.visits / maxVisits) * 100) : 0;
            html += '<tr class="db-ip-row">' +
                '<td class="db-ip-addr"><span class="db-ip-badge">' + escHtml(ip) + '</span></td>' +
                '<td class="db-ip-location">' +
                    '<span class="db-location-flag">' + flag + '</span> ' +
                    '<span>' + escHtml(location) + '</span>' +
                '</td>' +
                '<td class="db-ip-visits">' +
                    '<div class="db-ip-visits-inner">' +
                        '<span class="db-ip-count">' + info.visits + '</span>' +
                        '<div class="db-location-bar-track" style="width:60px"><div class="db-location-bar" style="width:' + barWidth + '%"></div></div>' +
                    '</div>' +
                '</td>' +
            '</tr>';
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    function renderRecentActivity(events) {
        var container = document.getElementById('dbRecentActivity');
        if (!container) return;

        var recent = events.slice(0, 8);
        if (recent.length === 0) {
            container.innerHTML = '<div class="db-empty" style="padding:20px">No activity yet</div>';
            return;
        }

        container.innerHTML = recent.map(function (e) {
            var info = SITE_EVENT_LABELS[e.event] || { label: e.event, icon: 'fa-globe', color: '#6b7280' };
            var pageName = (e.page || '').replace('.html', '');
            pageName = pageName ? pageName.charAt(0).toUpperCase() + pageName.slice(1) : '';
            var detail = info.label;
            if (pageName && e.event === 'page_view') detail = 'Viewed ' + pageName;
            else if (pageName) detail = info.label + ' on ' + pageName;
            var dotBg = info.color + '20';
            return '<div class="db-activity-item">' +
                '<span class="db-activity-dot" style="background:' + dotBg + ';color:' + info.color + '">' +
                    '<i class="fas ' + info.icon + '"></i>' +
                '</span>' +
                '<span class="db-activity-text">' + escHtml(detail) + '</span>' +
                '<span class="db-activity-time">' + timeAgo(e.timestamp) + '</span>' +
            '</div>';
        }).join('');
    }

    function messageItem(m, compact) {
        if (!m || typeof m !== 'object') return '';
        m.sender  = m.sender  || 'Unknown';
        m.subject = m.subject || '(No subject)';
        m.preview = m.preview || '';
        m.body    = m.body    || '';
        const unreadClass = m.read ? '' : ' unread';
        const dotHtml = m.read ? '' : '<div class="db-unread-dot"></div>';
        var feedbackBadge = '';
        var featuredBadge = '';
        var ratingStars = '';
        if (m._type === 'feedback') {
            feedbackBadge = ' <span class="db-badge db-badge-feedback">Feedback</span>';
            if (m._rating) {
                ratingStars = '<span class="db-msg-rating">';
                for (var rs = 1; rs <= 5; rs++) ratingStars += (rs <= m._rating ? '\u2605' : '\u2606');
                ratingStars += '</span>';
            }
        }
        if (m.showOnHomepage) {
            featuredBadge = ' <span class="db-badge db-badge-featured">Featured</span>';
        }
        var featureBtn = '<button class="db-feature-toggle' + (m.showOnHomepage ? ' active' : '') +
            '" data-msg-id="' + m.id + '" title="' + (m.showOnHomepage ? 'Remove from homepage' : 'Feature on homepage') + '">' +
            '<i class="fas fa-star"></i></button>';
        return '<div class="db-message-item' + unreadClass + '" data-msg-id="' + m.id + '">' +
            dotHtml +
            '<div class="db-msg-avatar">' + initials(m.sender) + '</div>' +
            '<div class="db-msg-content">' +
                '<div class="db-msg-top"><span class="db-msg-sender">' + m.sender + '</span>' + feedbackBadge + featuredBadge + '<span class="db-msg-time">' + timeAgo(m.time) + '</span></div>' +
                '<div class="db-msg-subject">' + m.subject + ratingStars + '</div>' +
                (compact ? '' : '<div class="db-msg-preview">' + m.preview + '</div>') +
                (compact ? '' : '<div class="db-msg-body">' + m.body + '</div>') +
            '</div>' +
            featureBtn +
        '</div>';
    }


    /* =============================================
       RENDERING — Rooms
       ============================================= */
    function renderRooms() {
        renderRates();
        renderSurcharges();
        renderCalendar();
        renderContentEditor();
    }

    /* =============================================
       RENDERING — Room Rates
       ============================================= */
    function isCustomRoom(type) {
        return DATA.customRooms && DATA.customRooms.some(function (r) { return r.key === type; });
    }

    function renderRates() {
        const tbody = document.getElementById('dbRatesBody');
        if (!tbody) return;

        var allTypes = getAllRoomTypes();

        tbody.innerHTML = allTypes.map(function (type) {
            const rate = DATA.rates[type] || ROOM_PRICES[type] || 100;
            const displayName = getDisplayName(type);
            const hasCustomName = DATA.roomNames && DATA.roomNames[type];
            const isCustom = isCustomRoom(type);
            return '<tr' + (isCustom ? ' class="db-custom-room-row"' : '') + '>' +
                '<td><span class="db-rate-key">' + escHtml(type) + '</span>' +
                    (isCustom ? ' <span class="db-badge-custom">Custom</span>' : '') +
                '</td>' +
                '<td>' +
                    '<input type="text" class="db-name-input" data-room="' + escAttr(type) + '" value="' + escAttr(displayName) + '">' +
                    (hasCustomName ? ' <button class="db-name-reset" data-room="' + escAttr(type) + '" title="Reset to default name"><i class="fas fa-undo"></i></button>' : '') +
                '</td>' +
                '<td><input type="number" class="db-rate-input" data-room="' + escAttr(type) + '" value="' + rate + '" min="1"></td>' +
                '<td class="db-rate-actions-cell">' +
                    '<button class="db-rate-save" data-room="' + escAttr(type) + '" title="Save"><i class="fas fa-check"></i></button>' +
                    (isCustom ? ' <button class="db-room-delete" data-room="' + escAttr(type) + '" title="Delete room type"><i class="fas fa-trash-alt"></i></button>' : '') +
                '</td>' +
            '</tr>';
        }).join('') +
        // Add Room row
        '<tr class="db-add-room-row">' +
            '<td colspan="4">' +
                '<div class="db-add-room-form" id="dbAddRoomForm">' +
                    '<button class="db-add-room-trigger" id="dbAddRoomTrigger"><i class="fas fa-plus-circle"></i> Add Room Type</button>' +
                    '<div class="db-add-room-fields" id="dbAddRoomFields" style="display:none">' +
                        '<input type="text" class="db-name-input" id="dbNewRoomName" placeholder="Room type name (e.g. Double Deluxe)">' +
                        '<input type="number" class="db-rate-input" id="dbNewRoomRate" placeholder="Rate" min="1" value="100">' +
                        '<button class="db-btn db-btn-primary db-btn-sm" id="dbNewRoomSave"><i class="fas fa-plus"></i> Add</button>' +
                        '<button class="db-btn db-btn-outline db-btn-sm" id="dbNewRoomCancel">Cancel</button>' +
                    '</div>' +
                '</div>' +
            '</td>' +
        '</tr>';

        // Add Room trigger toggle
        var trigger = document.getElementById('dbAddRoomTrigger');
        var fields = document.getElementById('dbAddRoomFields');
        if (trigger && fields) {
            trigger.addEventListener('click', function () {
                trigger.style.display = 'none';
                fields.style.display = 'flex';
                document.getElementById('dbNewRoomName').focus();
            });
        }

        // Cancel add
        var cancelBtn = document.getElementById('dbNewRoomCancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function () {
                fields.style.display = 'none';
                trigger.style.display = 'inline-flex';
                document.getElementById('dbNewRoomName').value = '';
                document.getElementById('dbNewRoomRate').value = '100';
            });
        }

        // Save new room type
        var saveNewBtn = document.getElementById('dbNewRoomSave');
        if (saveNewBtn) {
            saveNewBtn.addEventListener('click', function () {
                var nameInput = document.getElementById('dbNewRoomName');
                var rateInput = document.getElementById('dbNewRoomRate');
                var name = nameInput.value.trim();
                var rate = parseInt(rateInput.value);

                if (!name) { nameInput.focus(); return; }
                if (isNaN(rate) || rate < 1) { rateInput.focus(); return; }

                // Check for duplicate
                var existing = getAllRoomTypes();
                for (var i = 0; i < existing.length; i++) {
                    if (existing[i].toLowerCase() === name.toLowerCase()) {
                        nameInput.value = '';
                        nameInput.placeholder = 'Room type already exists!';
                        nameInput.focus();
                        setTimeout(function () { nameInput.placeholder = 'Room type name (e.g. Double Deluxe)'; }, 2000);
                        return;
                    }
                }

                // Add to customRooms
                DATA.customRooms.push({ key: name, defaultRate: rate, addedAt: new Date().toISOString() });

                // Initialize data structures for new room
                DATA.rates[name] = rate;
                DATA.blocked[name] = [];
                DATA.content[name] = {
                    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&q=80',
                    description: name + ' — a comfortable and elegant room at Lake Victoria Hotel.',
                    bedType: 'Double Bed', roomSize: '30 m²', maxGuests: '2 Guests'
                };

                addAuditEntry('room_type_add', 'room', 'New room type added: ' + name + ' ($' + rate + '/night)', { roomType: name, rate: rate });
                saveData(DATA);

                // Re-render everything with new room type
                resetRoomDropdowns();
                renderRooms();
            });
        }

        // Save handlers (rate + name)
        tbody.querySelectorAll('.db-rate-save').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.room;
                const rateInput = tbody.querySelector('.db-rate-input[data-room="' + type + '"]');
                const nameInput = tbody.querySelector('.db-name-input[data-room="' + type + '"]');
                if (!rateInput) return;

                // Save rate
                const val = parseInt(rateInput.value);
                if (isNaN(val) || val < 1) return;
                const oldRate = DATA.rates[type];
                if (oldRate !== val) {
                    DATA.rates[type] = val;
                    addAuditEntry('room_rate_edit', 'room', type + ' — $' + oldRate + ' → $' + val, { roomType: type, oldRate: oldRate, newRate: val });
                }

                // Save display name
                if (nameInput) {
                    const newName = nameInput.value.trim();
                    const oldName = getDisplayName(type);
                    if (newName && newName !== type) {
                        if (oldName !== newName) {
                            DATA.roomNames[type] = newName;
                            addAuditEntry('room_name_edit', 'room', type + ' → "' + newName + '"', { roomType: type, oldName: oldName, newName: newName });
                        }
                    } else if (newName === type || newName === '') {
                        // Reset to default
                        if (DATA.roomNames[type]) {
                            delete DATA.roomNames[type];
                            addAuditEntry('room_name_edit', 'room', type + ' — name reset to default', { roomType: type });
                        }
                        if (nameInput) nameInput.value = type;
                    }
                }

                saveData(DATA);
                // Flash confirmation
                btn.classList.add('saved');
                setTimeout(() => btn.classList.remove('saved'), 600);
                // Re-render to show/hide reset buttons and refresh dropdowns
                renderRates();
                refreshRoomTypeDropdowns();
            });
        });

        // Name reset handlers
        tbody.querySelectorAll('.db-name-reset').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.room;
                if (DATA.roomNames[type]) {
                    addAuditEntry('room_name_edit', 'room', type + ' — name reset to default', { roomType: type });
                    delete DATA.roomNames[type];
                    saveData(DATA);
                    renderRates();
                    refreshRoomTypeDropdowns();
                }
            });
        });

        // Delete custom room handlers
        tbody.querySelectorAll('.db-room-delete').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var type = btn.dataset.room;
                if (!confirm('Delete "' + type + '" room type? This cannot be undone.')) return;

                // Remove from customRooms
                DATA.customRooms = DATA.customRooms.filter(function (r) { return r.key !== type; });

                // Clean up data
                delete DATA.rates[type];
                delete DATA.blocked[type];
                delete DATA.content[type];
                if (DATA.roomNames[type]) delete DATA.roomNames[type];

                addAuditEntry('room_type_delete', 'room', 'Room type removed: ' + type, { roomType: type });
                saveData(DATA);

                resetRoomDropdowns();
                renderRooms();
            });
        });
    }

    // Reset room type dropdowns so they rebuild from scratch on next render
    function resetRoomDropdowns() {
        var calSel = document.getElementById('dbCalRoomType');
        var contentSel = document.getElementById('dbContentRoomType');
        if (calSel) { calSel.innerHTML = ''; }
        if (contentSel) { contentSel.innerHTML = ''; }
    }

    // Refresh calendar and content editor dropdowns after a name change
    function refreshRoomTypeDropdowns() {
        var calSel     = document.getElementById('dbCalRoomType');
        var contentSel = document.getElementById('dbContentRoomType');
        [calSel, contentSel].forEach(function (sel) {
            if (!sel) return;
            var currentVal = sel.value;
            Array.from(sel.options).forEach(function (opt) {
                opt.textContent = getDisplayName(opt.value);
            });
            sel.value = currentVal;
        });
    }


    /* =============================================
       RENDERING — Surcharges
       ============================================= */
    function renderSurcharges() {
        var input = document.getElementById('dbExtraAdultFee');
        var childAgeInput = document.getElementById('dbChildChargeAge');
        var childFeeInput = document.getElementById('dbChildFee');
        if (!input) return;
        input.value = DATA.extraAdultFee || 30;
        if (childAgeInput) childAgeInput.value = DATA.childChargeAge || 10;
        if (childFeeInput) childFeeInput.value = DATA.childFee || 30;

        var btn = document.getElementById('dbSurchargesSave');
        if (!btn) return;

        // Remove old listener by replacing node
        var newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', function () {
            var val = parseInt(input.value);
            if (isNaN(val) || val < 1) return;
            var changed = false;

            var oldFee = DATA.extraAdultFee || 30;
            if (oldFee !== val) {
                DATA.extraAdultFee = val;
                addAuditEntry('surcharge_edit', 'room', 'Extra Adult Fee — $' + oldFee + ' → $' + val, { oldFee: oldFee, newFee: val });
                changed = true;
            }

            if (childAgeInput) {
                var ageVal = parseInt(childAgeInput.value);
                if (!isNaN(ageVal) && ageVal >= 1 && ageVal <= 17) {
                    var oldAge = DATA.childChargeAge || 10;
                    if (oldAge !== ageVal) {
                        DATA.childChargeAge = ageVal;
                        addAuditEntry('surcharge_edit', 'room', 'Child Charge Age — ' + oldAge + ' → ' + ageVal + ' yrs', { oldAge: oldAge, newAge: ageVal });
                        changed = true;
                    }
                }
            }

            if (childFeeInput) {
                var feeVal = parseInt(childFeeInput.value);
                if (!isNaN(feeVal) && feeVal >= 1) {
                    var oldChildFee = DATA.childFee || 30;
                    if (oldChildFee !== feeVal) {
                        DATA.childFee = feeVal;
                        addAuditEntry('surcharge_edit', 'room', 'Child Fee — $' + oldChildFee + ' → $' + feeVal, { oldFee: oldChildFee, newFee: feeVal });
                        changed = true;
                    }
                }
            }

            if (changed) saveData(DATA);
            newBtn.classList.add('saved');
            setTimeout(function () { newBtn.classList.remove('saved'); }, 600);
        });
    }

    /* =============================================
       RENDERING — Availability Calendar
       ============================================= */
    let calMonth = new Date().getMonth();
    let calYear  = new Date().getFullYear();

    const MONTH_NAMES = ['January','February','March','April','May','June',
                         'July','August','September','October','November','December'];
    const DAY_NAMES   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

    function renderCalendar() {
        const grid     = document.getElementById('dbCalGrid');
        const monthEl  = document.getElementById('dbCalMonth');
        const typeSel  = document.getElementById('dbCalRoomType');
        if (!grid) return;

        // Populate room type dropdown once
        if (typeSel && typeSel.options.length === 0) {
            getAllRoomTypes().forEach(t => {
                const opt = document.createElement('option');
                opt.value = t;
                opt.textContent = getDisplayName(t);
                typeSel.appendChild(opt);
            });
        }

        const roomType = typeSel ? typeSel.value : getAllRoomTypes()[0];
        const blockedDates = DATA.blocked[roomType] || [];

        if (monthEl) monthEl.textContent = MONTH_NAMES[calMonth] + ' ' + calYear;

        const firstDay   = new Date(calYear, calMonth, 1);
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
        // Monday = 0, Sunday = 6
        let startDay = firstDay.getDay() - 1;
        if (startDay < 0) startDay = 6;

        const today    = new Date();
        const todayStr = today.toISOString().split('T')[0];

        let html = DAY_NAMES.map(d => '<div class="db-cal-head">' + d + '</div>').join('');

        // Leading empty cells
        for (let i = 0; i < startDay; i++) {
            html += '<div class="db-cal-day empty"></div>';
        }

        // Day cells
        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(calYear, calMonth, d);
            const dateStr = dateObj.getFullYear() + '-' +
                String(dateObj.getMonth() + 1).padStart(2, '0') + '-' +
                String(dateObj.getDate()).padStart(2, '0');

            const isPast    = dateStr < todayStr;
            const isToday   = dateStr === todayStr;
            const isBlocked = blockedDates.indexOf(dateStr) !== -1;

            let cls = 'db-cal-day';
            if (isPast)         cls += ' past';
            else if (isBlocked) cls += ' blocked';
            else                cls += ' available';
            if (isToday)        cls += ' today';

            html += '<div class="' + cls + '" data-date="' + dateStr + '">' + d + '</div>';
        }

        grid.innerHTML = html;

        // Click to toggle blocked/available
        grid.addEventListener('click', handleCalendarClick);
    }

    function handleCalendarClick(e) {
        const cell = e.target.closest('.db-cal-day');
        if (!cell || cell.classList.contains('past') || cell.classList.contains('empty')) return;
        // Remove listener to prevent duplicates — re-added on next render
        const grid = document.getElementById('dbCalGrid');
        if (grid) grid.removeEventListener('click', handleCalendarClick);

        const dateStr  = cell.dataset.date;
        const typeSel  = document.getElementById('dbCalRoomType');
        const roomType = typeSel ? typeSel.value : getAllRoomTypes()[0];

        if (!DATA.blocked[roomType]) DATA.blocked[roomType] = [];

        const idx = DATA.blocked[roomType].indexOf(dateStr);
        let blockAction;
        if (idx === -1) {
            DATA.blocked[roomType].push(dateStr);
            blockAction = 'date_block';
        } else {
            DATA.blocked[roomType].splice(idx, 1);
            blockAction = 'date_unblock';
        }

        saveData(DATA);
        addAuditEntry(blockAction, 'room', roomType + ' — ' + dateStr, { roomType: roomType, date: dateStr });
        renderCalendar();
    }

    // Calendar navigation & dropdown
    const calPrev    = document.getElementById('dbCalPrev');
    const calNext    = document.getElementById('dbCalNext');
    const calTypeSel = document.getElementById('dbCalRoomType');

    if (calPrev) {
        calPrev.addEventListener('click', () => {
            calMonth--;
            if (calMonth < 0) { calMonth = 11; calYear--; }
            renderCalendar();
        });
    }

    if (calNext) {
        calNext.addEventListener('click', () => {
            calMonth++;
            if (calMonth > 11) { calMonth = 0; calYear++; }
            renderCalendar();
        });
    }

    if (calTypeSel) {
        calTypeSel.addEventListener('change', renderCalendar);
    }


    /* =============================================
       RENDERING — Room Content Editor
       ============================================= */
    function escAttr(str) {
        return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function escHtml(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // Display name helper — returns custom name or falls back to internal key
    function getDisplayName(key) {
        return (DATA.roomNames && DATA.roomNames[key]) || key;
    }

    // Compress uploaded image via Canvas (max 600px wide, JPEG 0.75 quality)
    function compressImage(file, callback) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var img = new Image();
            img.onload = function () {
                var MAX_W = 600;
                var w = img.width;
                var h = img.height;
                if (w > MAX_W) { h = Math.round(h * (MAX_W / w)); w = MAX_W; }
                var canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                callback(canvas.toDataURL('image/jpeg', 0.75));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Track pending image per room (set by upload, consumed by save)
    var pendingImage = null;

    function renderContentEditor() {
        const container = document.getElementById('dbContentEditor');
        const typeSel   = document.getElementById('dbContentRoomType');
        if (!container) return;

        // Reset pending image on re-render
        pendingImage = null;

        // Populate room type dropdown once
        if (typeSel && typeSel.options.length === 0) {
            getAllRoomTypes().forEach(t => {
                const opt = document.createElement('option');
                opt.value = t;
                opt.textContent = getDisplayName(t);
                typeSel.appendChild(opt);
            });
        }

        const roomType = typeSel ? typeSel.value : getAllRoomTypes()[0];
        const info = DATA.content[roomType] || DEFAULT_CONTENT[roomType] || {};

        container.innerHTML =
            '<div class="db-content-row">' +
                '<div class="db-content-preview-wrap">' +
                    '<div class="db-content-upload-area" id="dbContentUploadArea">' +
                        '<img class="db-content-preview" id="dbContentPreview" src="' + escAttr(info.image || '') + '" alt="' + escAttr(roomType) + '">' +
                        '<div class="db-content-upload-overlay">' +
                            '<i class="fas fa-camera"></i>' +
                            '<span>Change Photo</span>' +
                        '</div>' +
                    '</div>' +
                    '<input type="file" id="dbContentFileInput" accept="image/*" style="display:none">' +
                '</div>' +
                '<div class="db-content-fields">' +
                    '<label class="db-content-label">Room Photo</label>' +
                    '<div class="db-content-upload-info">' +
                        '<span class="db-content-filename" id="dbContentFilename">' +
                            (info.image && info.image.indexOf('data:') === 0 ? '<i class="fas fa-check-circle"></i> Custom photo uploaded' : '<i class="fas fa-image"></i> Using default image') +
                        '</span>' +
                        '<button type="button" class="db-btn db-btn-outline db-content-upload-btn" id="dbContentUploadBtn"><i class="fas fa-upload"></i> Upload Image</button>' +
                    '</div>' +
                    '<label class="db-content-label">Description</label>' +
                    '<textarea class="db-content-input db-content-textarea" id="dbContentDesc" rows="3" placeholder="Room description...">' + escHtml(info.description || '') + '</textarea>' +
                '</div>' +
            '</div>' +
            '<div class="db-content-details-row">' +
                '<div class="db-content-detail">' +
                    '<label class="db-content-label"><i class="fas fa-bed"></i> Bed Type</label>' +
                    '<input type="text" class="db-content-input" id="dbContentBed" value="' + escAttr(info.bedType || '') + '">' +
                '</div>' +
                '<div class="db-content-detail">' +
                    '<label class="db-content-label"><i class="fas fa-expand-arrows-alt"></i> Room Size</label>' +
                    '<input type="text" class="db-content-input" id="dbContentSize" value="' + escAttr(info.roomSize || '') + '">' +
                '</div>' +
                '<div class="db-content-detail">' +
                    '<label class="db-content-label"><i class="fas fa-users"></i> Max Guests</label>' +
                    '<input type="text" class="db-content-input" id="dbContentGuests" value="' + escAttr(info.maxGuests || '') + '">' +
                '</div>' +
            '</div>' +
            '<div class="db-content-actions">' +
                '<button class="db-btn db-btn-primary" id="dbContentSave"><i class="fas fa-check"></i> Save Changes</button>' +
                '<button class="db-btn db-btn-outline" id="dbContentReset"><i class="fas fa-undo"></i> Reset to Default</button>' +
            '</div>';

        // File upload wiring
        var fileInput   = document.getElementById('dbContentFileInput');
        var uploadArea  = document.getElementById('dbContentUploadArea');
        var uploadBtn   = document.getElementById('dbContentUploadBtn');
        var preview     = document.getElementById('dbContentPreview');
        var filenameEl  = document.getElementById('dbContentFilename');

        function triggerUpload() { if (fileInput) fileInput.click(); }
        if (uploadArea) uploadArea.addEventListener('click', triggerUpload);
        if (uploadBtn)  uploadBtn.addEventListener('click', triggerUpload);

        if (fileInput) {
            fileInput.addEventListener('change', function () {
                var file = fileInput.files[0];
                if (!file) return;
                compressImage(file, function (dataUrl) {
                    pendingImage = dataUrl;
                    if (preview)    preview.src = dataUrl;
                    if (filenameEl) filenameEl.innerHTML = '<i class="fas fa-check-circle"></i> ' + escHtml(file.name);
                });
            });
        }

        // Drag-and-drop on preview area
        if (uploadArea) {
            uploadArea.addEventListener('dragover', function (e) {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            uploadArea.addEventListener('dragleave', function () {
                uploadArea.classList.remove('dragover');
            });
            uploadArea.addEventListener('drop', function (e) {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                var file = e.dataTransfer.files[0];
                if (!file || !file.type.startsWith('image/')) return;
                compressImage(file, function (dataUrl) {
                    pendingImage = dataUrl;
                    if (preview)    preview.src = dataUrl;
                    if (filenameEl) filenameEl.innerHTML = '<i class="fas fa-check-circle"></i> ' + escHtml(file.name);
                });
            });
        }

        // Save handler
        var saveBtn = document.getElementById('dbContentSave');
        if (saveBtn) {
            saveBtn.addEventListener('click', function () {
                var currentImage = pendingImage || (DATA.content[roomType] && DATA.content[roomType].image) || info.image;
                DATA.content[roomType] = {
                    image:       currentImage,
                    description: document.getElementById('dbContentDesc').value,
                    bedType:     document.getElementById('dbContentBed').value,
                    roomSize:    document.getElementById('dbContentSize').value,
                    maxGuests:   document.getElementById('dbContentGuests').value
                };
                saveData(DATA);
                addAuditEntry('room_content_edit', 'room', roomType + ' content updated' + (pendingImage ? ' (new photo)' : ''), { roomType: roomType });
                pendingImage = null;
                saveBtn.classList.add('saved');
                saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
                if (filenameEl) filenameEl.innerHTML = '<i class="fas fa-check-circle"></i> Custom photo uploaded';
                setTimeout(function () {
                    saveBtn.classList.remove('saved');
                    saveBtn.innerHTML = '<i class="fas fa-check"></i> Save Changes';
                }, 1200);
            });
        }

        // Reset handler
        var resetBtn = document.getElementById('dbContentReset');
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                DATA.content[roomType] = Object.assign({}, DEFAULT_CONTENT[roomType]);
                saveData(DATA);
                pendingImage = null;
                renderContentEditor();
            });
        }
    }

    // Content editor dropdown wiring
    var contentTypeSel = document.getElementById('dbContentRoomType');
    if (contentTypeSel) {
        contentTypeSel.addEventListener('change', renderContentEditor);
    }


    /* =============================================
       RENDERING — Messages
       ============================================= */
    function renderMessages() {
        importFeedback();
        const container = document.getElementById('dbAllMessages');
        if (!container) return;

        if (!DATA.messages || DATA.messages.length === 0) {
            container.innerHTML =
                '<div style="padding:48px 24px;text-align:center;color:var(--db-text-light)">' +
                    '<i class="fas fa-inbox" style="font-size:2.5rem;margin-bottom:16px;display:block;opacity:0.35"></i>' +
                    '<p style="margin:0 0 8px;font-size:1rem;font-weight:600;color:var(--db-text)">No messages yet</p>' +
                    '<p style="margin:0 0 20px;font-size:0.85rem">Guest enquiries and feedback will appear here.</p>' +
                    '<button id="dbRestoreSeedMsgs" class="db-btn db-btn-outline db-btn-sm"><i class="fas fa-undo"></i> Restore Demo Messages</button>' +
                '</div>';
            var restoreBtn = document.getElementById('dbRestoreSeedMsgs');
            if (restoreBtn) {
                restoreBtn.addEventListener('click', function () {
                    var seed = generateSeedData();
                    DATA.messages = seed.messages;
                    saveData(DATA);
                    renderMessages();
                    setTextById('dbUnreadCount', DATA.messages.filter(function (m) { return !m.read; }).length);
                });
            }
            return;
        }

        try {
            container.innerHTML = DATA.messages.map(function (m) { return messageItem(m, false); }).join('');
        } catch (e) {
            container.innerHTML =
                '<div style="padding:32px 24px;text-align:center;color:#ef4444">' +
                    '<i class="fas fa-exclamation-circle" style="font-size:2rem;margin-bottom:12px;display:block"></i>' +
                    '<p style="margin:0 0 8px;font-weight:600">Error rendering messages</p>' +
                    '<p style="margin:0 0 16px;font-size:0.82rem;color:var(--db-text-light)">' + (e.message || 'Unknown error') + '</p>' +
                    '<button id="dbRestoreSeedMsgs" class="db-btn db-btn-outline db-btn-sm"><i class="fas fa-undo"></i> Restore Demo Messages</button>' +
                '</div>';
            var restoreBtn2 = document.getElementById('dbRestoreSeedMsgs');
            if (restoreBtn2) {
                restoreBtn2.addEventListener('click', function () {
                    var seed = generateSeedData();
                    DATA.messages = seed.messages;
                    saveData(DATA);
                    renderMessages();
                });
            }
            return;
        }

        // Click to expand and mark as read
        container.querySelectorAll('.db-message-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = parseInt(item.dataset.msgId);
                item.classList.toggle('expanded');

                // Mark as read
                const msg = DATA.messages.find(m => m.id === id);
                if (msg && !msg.read) {
                    msg.read = true;
                    saveData(DATA);
                    addAuditEntry('message_read', 'message', msg.sender + ' — ' + msg.subject, { messageId: id });
                    item.classList.remove('unread');
                    const dot = item.querySelector('.db-unread-dot');
                    if (dot) dot.remove();

                    // Update badge
                    const unread = DATA.messages.filter(m => !m.read).length;
                    setTextById('dbUnreadCount', unread);
                }
            });
        });

        // Feature toggle (star button) — show/hide message on homepage testimonials
        container.querySelectorAll('.db-feature-toggle').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var msgId = parseInt(btn.dataset.msgId);
                var msg = DATA.messages.find(function (m) { return m.id === msgId; });
                if (!msg) return;

                // Remove any existing country prompt
                var existingPrompt = container.querySelector('.db-country-prompt');
                if (existingPrompt) existingPrompt.remove();

                if (msg.showOnHomepage) {
                    // Unfeature
                    msg.showOnHomepage = false;
                    msg._country = '';
                    saveData(DATA);
                    addAuditEntry('testimonial_removed', 'content', 'Removed ' + msg.sender + ' from homepage testimonials', { messageId: msgId });
                    renderMessages();
                    return;
                }

                // Check 3-max limit
                var featured = DATA.messages.filter(function (m) { return m.showOnHomepage; });
                if (featured.length >= 3) {
                    alert('Maximum 3 testimonials can be featured on the homepage. Please unfeature one first.');
                    return;
                }

                // Show inline country prompt
                var prompt = document.createElement('div');
                prompt.className = 'db-country-prompt';
                prompt.innerHTML = '<input type="text" class="db-country-input" placeholder="Guest country (e.g. Uganda)" maxlength="60">' +
                    '<button class="db-country-confirm">Feature</button>' +
                    '<button class="db-country-cancel">Cancel</button>';
                btn.closest('.db-message-item').appendChild(prompt);

                var input = prompt.querySelector('.db-country-input');
                input.focus();

                prompt.querySelector('.db-country-confirm').addEventListener('click', function (ev) {
                    ev.stopPropagation();
                    var country = input.value.trim() || 'Valued Guest';
                    msg.showOnHomepage = true;
                    msg._country = country;
                    saveData(DATA);
                    addAuditEntry('testimonial_added', 'content', 'Featured ' + msg.sender + ' (' + country + ') on homepage', { messageId: msgId });
                    renderMessages();
                });

                prompt.querySelector('.db-country-cancel').addEventListener('click', function (ev) {
                    ev.stopPropagation();
                    prompt.remove();
                });

                // Prevent input clicks from bubbling to message expand
                input.addEventListener('click', function (ev) { ev.stopPropagation(); });
            });
        });
    }

    // Refresh Messages button — re-reads localStorage for any new feedback
    var refreshMsgBtn = document.getElementById('dbRefreshMessages');
    if (refreshMsgBtn) {
        refreshMsgBtn.addEventListener('click', function () {
            refreshMsgBtn.querySelector('i').classList.add('fa-spin');
            // Force re-read from localStorage to catch feedback written by public pages
            try {
                var freshData = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
                if (freshData && freshData.messages) {
                    var existingFbIds = {};
                    DATA.messages.forEach(function (m) { if (m._feedbackId) existingFbIds[m._feedbackId] = true; });
                    var added = 0;
                    freshData.messages.forEach(function (m) {
                        if (m._type === 'feedback' && m._feedbackId && !existingFbIds[m._feedbackId]) {
                            DATA.messages.unshift(m);
                            existingFbIds[m._feedbackId] = true;
                            added++;
                        }
                    });
                    if (added > 0) {
                        DATA.messages.sort(function (a, b) { return new Date(b.time) - new Date(a.time); });
                        saveData(DATA);
                    }
                }
            } catch (e) { /* parse error */ }
            importFeedback();
            renderMessages();
            setTimeout(function () {
                refreshMsgBtn.querySelector('i').classList.remove('fa-spin');
            }, 600);
        });
    }


    /* =============================================
       RENDERING — Analytics
       ============================================= */
    let analyticsDateRange = 'month';

    function renderAnalytics() {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const TOTAL = DATA.rooms.length;

        // Compute period start/end based on selected range
        var periodStart, periodEnd, periodDays;
        if (analyticsDateRange === 'all') {
            // Use earliest booking date or 365 days ago
            var earliest = todayStr;
            DATA.bookings.forEach(function (b) { if (b.checkin < earliest) earliest = b.checkin; });
            periodStart = earliest;
            periodEnd = todayStr;
            periodDays = Math.max(1, Math.round((new Date(periodEnd) - new Date(periodStart)) / 86400000));
        } else if (analyticsDateRange === 'month') {
            periodStart = todayStr.substring(0, 7) + '-01';
            var nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            periodEnd = nextMonth.toISOString().split('T')[0];
            periodDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        } else {
            var days = parseInt(analyticsDateRange) || 30;
            var startDate = new Date(now);
            startDate.setDate(startDate.getDate() - days);
            periodStart = startDate.toISOString().split('T')[0];
            periodEnd = todayStr;
            periodDays = days;
        }

        // Revenue from actual bookings × rates in the period
        const activeBookings = DATA.bookings.filter(b => b.status !== 'cancelled');
        var periodRev = 0;
        var totalBookedNights = 0;
        var endForOverlap = analyticsDateRange === 'month' ? periodEnd : new Date(new Date(periodEnd).getTime() + 86400000).toISOString().split('T')[0];
        activeBookings.forEach(function (b) {
            var nights = overlapNights(b.checkin, b.checkout, periodStart, endForOverlap);
            if (nights > 0) {
                var rate = DATA.rates[b.room] || ROOM_PRICES[b.room] || 0;
                periodRev += rate * nights;
                totalBookedNights += nights;
            }
        });

        // ADR = revenue / room-nights sold
        var adr = totalBookedNights > 0 ? Math.round(periodRev / totalBookedNights) : 0;

        // RevPAR = revenue / (total rooms × days in period)
        var revpar = TOTAL > 0 ? Math.round(periodRev / (TOTAL * periodDays)) : 0;

        // Update stat labels dynamically
        var rangeLabels = {
            '7': '7-Day', '30': '30-Day', 'month': 'Monthly', 'all': 'Total'
        };
        var prefix = rangeLabels[analyticsDateRange] || 'Period';
        setTextById('analyticsRevenueLabel', prefix + ' Revenue');
        setTextById('analyticsADRLabel', 'Avg. Daily Rate');
        setTextById('analyticsRevPARLabel', 'RevPAR');

        setTextById('analyticsRevenue', '$' + periodRev.toLocaleString());
        setTextById('analyticsADR', '$' + adr.toLocaleString());
        setTextById('analyticsRevPAR', '$' + revpar.toLocaleString());

        // Update chart title
        var chartTitleMap = {
            '7': 'Revenue Trend (7 Days)', '30': 'Revenue Trend (30 Days)',
            'month': 'Revenue Trend (This Month)', 'all': 'Revenue Trend (All Time)'
        };
        setTextById('analyticsChartTitle', chartTitleMap[analyticsDateRange] || 'Revenue Trend');

        renderRevenueChart();
        attachAnalyticsFilter();
    }

    function attachAnalyticsFilter() {
        var filterBar = document.getElementById('dbAnalyticsDateFilter');
        if (!filterBar || filterBar._bound) return;
        filterBar._bound = true;
        var pills = filterBar.querySelectorAll('.db-pill');
        pills.forEach(function (pill) {
            pill.addEventListener('click', function () {
                pills.forEach(function (b) { b.classList.remove('active'); });
                pill.classList.add('active');
                analyticsDateRange = pill.dataset.range;
                renderAnalytics();
            });
        });
    }


    /* =============================================
       CHARTS — Canvas (DPR-aware)
       ============================================= */
    function setupCanvas(canvasEl) {
        const wrap = canvasEl.parentElement;
        const dpr = window.devicePixelRatio || 1;
        const w = wrap.clientWidth;
        const h = wrap.clientHeight;
        canvasEl.width = w * dpr;
        canvasEl.height = h * dpr;
        canvasEl.style.width = w + 'px';
        canvasEl.style.height = h + 'px';
        const ctx = canvasEl.getContext('2d');
        ctx.scale(dpr, dpr);
        return { ctx, w, h };
    }

    function drawLineChart(canvasId, dataPoints, labelFn, valueFn, unit, color) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const { ctx, w, h } = setupCanvas(canvas);
        const pad = { top: 20, right: 20, bottom: 30, left: 45 };
        const chartW = w - pad.left - pad.right;
        const chartH = h - pad.top - pad.bottom;

        if (dataPoints.length < 2) return;

        const values = dataPoints.map(valueFn);
        const maxVal = Math.max(...values) * 1.1;
        const minVal = Math.min(0, Math.min(...values));

        ctx.clearRect(0, 0, w, h);

        // Grid lines
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 0.5;
        const gridLines = 4;
        for (let i = 0; i <= gridLines; i++) {
            const y = pad.top + (chartH / gridLines) * i;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(w - pad.right, y);
            ctx.stroke();

            // Y-axis labels
            const val = maxVal - ((maxVal - minVal) / gridLines) * i;
            ctx.fillStyle = '#9ca3af';
            ctx.font = '11px Lato, sans-serif';
            ctx.textAlign = 'right';
            var yLabel = unit === '$' ? '$' + Math.round(val).toLocaleString() : unit === '%' ? Math.round(val) + '%' : Math.round(val).toString();
            ctx.fillText(yLabel, pad.left - 8, y + 4);
        }

        // X-axis labels (show ~6 evenly spaced)
        const labelCount = Math.min(6, dataPoints.length);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#9ca3af';
        for (let i = 0; i < labelCount; i++) {
            const idx = Math.floor((i / (labelCount - 1)) * (dataPoints.length - 1));
            const x = pad.left + (idx / (dataPoints.length - 1)) * chartW;
            ctx.fillText(labelFn(dataPoints[idx]), x, h - 6);
        }

        // Line path
        const points = values.map((v, i) => ({
            x: pad.left + (i / (values.length - 1)) * chartW,
            y: pad.top + chartH - ((v - minVal) / (maxVal - minVal)) * chartH
        }));

        // Gradient fill
        const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
        grad.addColorStop(0, color + '30');
        grad.addColorStop(1, color + '05');

        ctx.beginPath();
        ctx.moveTo(points[0].x, pad.top + chartH);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(points[points.length - 1].x, pad.top + chartH);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Line
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();

        // Dots
        points.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();
        });
    }

    // Revenue chart (used by Analytics section) — respects analyticsDateRange
    function renderRevenueChart() {
        var filtered = filterEventsByRange(DATA.revenue, analyticsDateRange);
        if (filtered.length < 2) {
            // Not enough data — show at least 2 points
            filtered = DATA.revenue.slice(-2);
        }
        drawLineChart(
            'dbRevChart',
            filtered,
            d => { const dt = new Date(d.date); return (dt.getMonth() + 1) + '/' + dt.getDate(); },
            d => d.amount,
            '$',
            '#c9a84c'
        );
    }


    /* =============================================
       RENDERING — Audit & Site Activity
       ============================================= */
    let auditDateRange = 'all';
    let auditSource = 'all';
    let auditSearch = '';
    let auditChartRange = 7;

    function renderAuditSection() {
        renderSiteStats();
        renderSiteActivityChart(auditChartRange);
        renderEventTypeDonut();
        renderAuditTable();
        attachAuditFilters();
    }

    function renderSiteStats() {
        const events = loadSiteAnalytics();
        const counts = { booking_confirmed: 0, contact_enquiry: 0, availability_check: 0, room_book_click: 0, pdf_download: 0 };
        events.forEach(e => { if (counts[e.event] !== undefined) counts[e.event]++; });

        setTextById('auditStatBooking', counts.booking_confirmed);
        setTextById('auditStatContact', counts.contact_enquiry);
        setTextById('auditStatAvail', counts.availability_check);
        setTextById('auditStatClicks', counts.room_book_click);
        setTextById('auditStatPdf', counts.pdf_download);
    }

    function renderSiteActivityChart(range) {
        if (range !== undefined) auditChartRange = range;
        const events = loadSiteAnalytics();
        const now = new Date();
        const days = [];

        for (let i = auditChartRange - 1; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const count = events.filter(e => e.timestamp && e.timestamp.split('T')[0] === dateStr).length;
            days.push({ date: dateStr, count: count });
        }

        drawLineChart(
            'dbAuditChart',
            days,
            d => { const dt = new Date(d.date); return (dt.getMonth() + 1) + '/' + dt.getDate(); },
            d => d.count,
            '',
            '#2c6e49'
        );
    }

    function renderEventTypeDonut() {
        const donut = document.getElementById('dbAuditDonut');
        const legend = document.getElementById('dbAuditDonutLegend');
        const totalEl = document.getElementById('dbAuditDonutTotal');
        if (!donut) return;

        const events = loadSiteAnalytics();
        const auditEntries = DATA.auditLog || [];
        const totalCount = events.length + auditEntries.length;
        if (totalEl) totalEl.textContent = totalCount;

        const buckets = {};
        events.forEach(e => {
            const lbl = (SITE_EVENT_LABELS[e.event] || {}).label || e.event;
            buckets[lbl] = (buckets[lbl] || 0) + 1;
        });
        auditEntries.forEach(e => {
            const lbl = (ACTION_TYPES[e.action] || {}).label || e.action;
            buckets[lbl] = (buckets[lbl] || 0) + 1;
        });

        const palette = ['#22c55e', '#3b82f6', '#c9a84c', '#8b5cf6', '#ef4444', '#f59e0b', '#6b7280', '#14b8a6'];
        const entries = Object.entries(buckets).sort((a, b) => b[1] - a[1]);

        if (entries.length === 0) {
            donut.style.background = 'var(--db-bg)';
            if (legend) legend.innerHTML = '<div style="color:var(--db-text-light);font-size:0.82rem">No events yet</div>';
            return;
        }

        let offset = 0;
        const segments = [];
        entries.forEach(([, count], i) => {
            const pct = (count / totalCount) * 100;
            const color = palette[i % palette.length];
            segments.push(color + ' ' + offset + '% ' + (offset + pct) + '%');
            offset += pct;
        });

        donut.style.background = 'conic-gradient(' + segments.join(', ') + ')';

        if (legend) {
            legend.innerHTML = entries.slice(0, 6).map(([label, count], i) =>
                '<div class="db-legend-item">' +
                    '<span class="db-legend-dot" style="background:' + palette[i % palette.length] + '"></span>' +
                    label + ' (' + count + ')' +
                '</div>'
            ).join('');
        }
    }

    function formatAuditTime(isoStr) {
        const d = new Date(isoStr);
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        var h = d.getHours(), m = d.getMinutes();
        var ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return months[d.getMonth()] + ' ' + d.getDate() + ', ' + h + ':' + String(m).padStart(2, '0') + ' ' + ampm;
    }

    function buildSiteEventDetails(event) {
        var info = SITE_EVENT_LABELS[event.event] || {};
        return (info.label || event.event) + (event.details ? ' — ' + event.details : '');
    }

    function applyAuditFilters(entries) {
        var now = new Date();
        var todayStr = now.toISOString().split('T')[0];

        // Date range filter
        if (auditDateRange !== 'all') {
            entries = entries.filter(function (e) {
                var ts = e.timestamp;
                if (!ts) return false;
                var dateStr = ts.split('T')[0];
                if (auditDateRange === 'today') return dateStr === todayStr;
                var cutoff = new Date(now);
                cutoff.setDate(cutoff.getDate() - parseInt(auditDateRange));
                return new Date(ts) >= cutoff;
            });
        }

        // Source filter
        if (auditSource !== 'all') {
            entries = entries.filter(function (e) {
                return e._source === auditSource;
            });
        }

        // Search filter
        if (auditSearch) {
            var q = auditSearch.toLowerCase();
            entries = entries.filter(function (e) {
                return (e._label + ' ' + e._details + ' ' + (e._source || '')).toLowerCase().indexOf(q) !== -1;
            });
        }

        return entries;
    }

    function renderAuditTable() {
        var tbody = document.getElementById('dbAuditTableBody');
        var countEl = document.getElementById('dbAuditCount');
        if (!tbody) return;

        // Merge admin + site events into unified list
        var merged = [];

        // Admin audit log
        (DATA.auditLog || []).forEach(function (e) {
            var info = ACTION_TYPES[e.action] || {};
            merged.push({
                timestamp: e.timestamp,
                _source: 'admin',
                _label: info.label || e.action,
                _details: e.details || '',
                _icon: info.icon || 'fa-cog',
                _color: info.color || '#6b7280'
            });
        });

        // Site analytics events
        loadSiteAnalytics().forEach(function (e) {
            var info = SITE_EVENT_LABELS[e.event] || {};
            merged.push({
                timestamp: e.timestamp,
                _source: 'site',
                _label: info.label || e.event,
                _details: e.details || '',
                _icon: info.icon || 'fa-globe',
                _color: info.color || '#3b82f6'
            });
        });

        // Sort newest first
        merged.sort(function (a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });

        // Apply filters
        var filtered = applyAuditFilters(merged);

        if (countEl) countEl.textContent = filtered.length + ' entr' + (filtered.length === 1 ? 'y' : 'ies');

        // Show max 50
        var visible = filtered.slice(0, 50);

        if (visible.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="db-audit-empty"><i class="fas fa-clipboard-list"></i>No activity found</td></tr>';
            return;
        }

        tbody.innerHTML = visible.map(function (e) {
            var sourceBadge = '<span class="db-source-badge ' + e._source + '">' + (e._source === 'admin' ? 'Admin' : 'Website') + '</span>';
            var iconBg = e._color + '18';
            return '<tr>' +
                '<td style="white-space:nowrap;font-size:0.78rem;color:var(--db-text-light)">' + formatAuditTime(e.timestamp) + '</td>' +
                '<td>' + sourceBadge + '</td>' +
                '<td><div class="db-audit-action-cell">' +
                    '<span class="db-audit-action-icon" style="background:' + iconBg + ';color:' + e._color + '"><i class="fas ' + e._icon + '"></i></span>' +
                    '<span>' + escHtml(e._label) + '</span>' +
                '</div></td>' +
                '<td style="font-size:0.82rem;color:var(--db-text-light);max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escHtml(e._details) + '</td>' +
            '</tr>';
        }).join('');
    }

    function attachAuditFilters() {
        // Date range pills
        var dateFilter = document.getElementById('dbAuditDateFilter');
        if (dateFilter && !dateFilter._bound) {
            dateFilter._bound = true;
            dateFilter.addEventListener('click', function (e) {
                var pill = e.target.closest('.db-pill');
                if (!pill) return;
                dateFilter.querySelectorAll('.db-pill').forEach(function (p) { p.classList.remove('active'); });
                pill.classList.add('active');
                auditDateRange = pill.dataset.range;
                renderAuditTable();
            });
        }

        // Source pills
        var sourceFilter = document.getElementById('dbAuditSourceFilter');
        if (sourceFilter && !sourceFilter._bound) {
            sourceFilter._bound = true;
            sourceFilter.addEventListener('click', function (e) {
                var pill = e.target.closest('.db-pill');
                if (!pill) return;
                sourceFilter.querySelectorAll('.db-pill').forEach(function (p) { p.classList.remove('active'); });
                pill.classList.add('active');
                auditSource = pill.dataset.source;
                renderAuditTable();
            });
        }

        // Search input
        var searchInput = document.getElementById('dbAuditSearch');
        if (searchInput && !searchInput._bound) {
            searchInput._bound = true;
            searchInput.addEventListener('input', function () {
                auditSearch = searchInput.value;
                renderAuditTable();
            });
        }

        // Chart toggle
        var chartToggle = document.getElementById('dbAuditChartToggle');
        if (chartToggle && !chartToggle._bound) {
            chartToggle._bound = true;
            chartToggle.addEventListener('click', function (e) {
                var btn = e.target.closest('button');
                if (!btn) return;
                chartToggle.querySelectorAll('button').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                renderSiteActivityChart(parseInt(btn.dataset.range));
            });
        }

        // CSV export
        var exportBtn = document.getElementById('dbAuditExport');
        if (exportBtn && !exportBtn._bound) {
            exportBtn._bound = true;
            exportBtn.addEventListener('click', exportAuditCSV);
        }
    }

    function exportAuditCSV() {
        var rows = [['Timestamp', 'Source', 'Action', 'Details']];

        (DATA.auditLog || []).forEach(function (e) {
            var info = ACTION_TYPES[e.action] || {};
            rows.push([e.timestamp, 'Admin', info.label || e.action, e.details || '']);
        });

        loadSiteAnalytics().forEach(function (e) {
            var info = SITE_EVENT_LABELS[e.event] || {};
            rows.push([e.timestamp, 'Website', info.label || e.event, e.details || '']);
        });

        // Sort newest first
        rows.sort(function (a, b) {
            if (a[0] === 'Timestamp') return -1;
            return new Date(b[0]) - new Date(a[0]);
        });

        var csv = rows.map(function (r) {
            return r.map(function (cell) {
                return '"' + String(cell).replace(/"/g, '""') + '"';
            }).join(',');
        }).join('\n');

        var blob = new Blob([csv], { type: 'text/csv' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'lvh-audit-log-' + new Date().toISOString().split('T')[0] + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }


    /* =============================================
       UTILITIES
       ============================================= */
    function setTextById(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Filter an array of event objects by date range.
     * Each object should have a `timestamp`, `date`, or `time` field.
     * @param {Array} events
     * @param {string} range - 'all', 'month', '7', '30'
     * @returns {Array} filtered events
     */
    function filterEventsByRange(events, range) {
        if (range === 'all') return events;
        var now = new Date();
        var cutoff;
        if (range === 'month') {
            cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
        } else {
            var days = parseInt(range) || 30;
            cutoff = new Date(now);
            cutoff.setDate(cutoff.getDate() - days);
            cutoff.setHours(0, 0, 0, 0);
        }
        return events.filter(function (ev) {
            var ts = ev.timestamp || ev.date || ev.time;
            if (!ts) return false;
            return new Date(ts) >= cutoff;
        });
    }

    /**
     * Return a human-readable label for a date range value.
     * @param {string} range - 'all', 'month', '7', '30'
     * @returns {string}
     */
    function getDateRangeLabel(range) {
        var now = new Date();
        var opts = { month: 'short', day: '2-digit', year: 'numeric' };
        var endStr = now.toLocaleDateString('en-US', opts);
        if (range === 'all') return 'All Time';
        if (range === 'month') {
            var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return monthStart.toLocaleDateString('en-US', opts) + ' — ' + endStr;
        }
        var days = parseInt(range) || 30;
        var start = new Date(now);
        start.setDate(start.getDate() - days);
        return start.toLocaleDateString('en-US', opts) + ' — ' + endStr;
    }


    /* =============================================
       RECOVERY TOAST
       ============================================= */
    function showRecoveryToast() {
        var toast = document.createElement('div');
        toast.className = 'db-recovery-toast';
        toast.innerHTML = '<i class="fas fa-database"></i> Data recovered from backup — your rates and settings have been restored.';
        document.body.appendChild(toast);
        requestAnimationFrame(function () { toast.classList.add('show'); });
        setTimeout(function () {
            toast.classList.remove('show');
            setTimeout(function () { toast.remove(); }, 400);
        }, 5000);
    }


    /* =============================================
       EXPORT / IMPORT DATA
       ============================================= */
    var exportBtn = document.getElementById('dbExportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function () {
            var blob = new Blob([JSON.stringify(DATA, null, 2)], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'lvh-dashboard-backup-' + new Date().toISOString().split('T')[0] + '.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            addAuditEntry('data_reset', 'system', 'Dashboard data exported as JSON backup');
        });
    }

    // Save to Site — write site-config.js directly to disk via File System Access API
    var saveConfigBtn = document.getElementById('dbSaveConfigBtn');
    var _siteConfigFileHandle = null;

    // Load previously stored file handle from IndexedDB
    openIDB().then(function (db) {
        var tx = db.transaction(IDB_STORE, 'readonly');
        var req = tx.objectStore(IDB_STORE).get('site-config-filehandle');
        req.onsuccess = function () { if (req.result) _siteConfigFileHandle = req.result; };
    }).catch(function () {});

    function _buildSiteConfigContent() {
        var featured = (DATA.messages || []).filter(function (m) { return m.showOnHomepage; }).map(function (m) {
            var text = (m.body || m.preview || '');
            text = text.replace(/\n\nRating:[\s\S]*$/, '').trim();
            if (text.length > 180) text = text.substring(0, 177) + '...';
            var starCount = (m._type === 'feedback' && m._rating) ? m._rating : 5;
            return { name: m.sender, country: m._country || 'Valued Guest', text: text, stars: starCount };
        });
        var savedMessages = (DATA.messages || []).map(function (m) {
            return {
                id: m.id, sender: m.sender, subject: m.subject,
                preview: m.preview, body: m.body, time: m.time,
                read: m.read, showOnHomepage: m.showOnHomepage || false,
                _country: m._country || '', _type: m._type || '',
                _rating: m._rating || 0, _feedbackId: m._feedbackId || ''
            };
        });
        var cfg = {
            extraAdultFee:  DATA.extraAdultFee  || 30,
            childChargeAge: DATA.childChargeAge || 10,
            childFee:       DATA.childFee       || 30,
            rates:          DATA.rates          || {},
            roomNames:      DATA.roomNames      || {},
            customRooms:    DATA.customRooms    || [],
            blocked:        DATA.blocked        || {},
            content:        DATA.content        || {},
            heroSlides:     DATA.heroSlides     || [],
            newsFeeds:      DATA.newsFeeds      || [],
            guestRating:    DATA.guestRating    || { average: 0, count: 0 },
            facilities:      DATA.facilities      || [],
            packages:        DATA.packages        || [],
            managementTeam:  DATA.managementTeam  || [],
            surroundings:    DATA.surroundings    || [],
            menuFiles:       DATA.menuFiles       || { food: null, drinks: null, snacks: null, desserts: null, mains: null, starters: null },
            featuredTestimonials: featured,
            messages: savedMessages
        };
        return [
            '/* =============================================',
            '   Lake Victoria Hotel \u2014 Site Configuration',
            '   ==============================================',
            '   Auto-generated from Dashboard on ' + new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
            '   ============================================= */',
            '',
            'window.LVH_SITE_CONFIG = ' + JSON.stringify(cfg, null, 4) + ';',
            ''
        ].join('\n');
    }

    function _downloadConfigFallback(content) {
        var blob = new Blob([content], { type: 'application/javascript' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'site-config.js';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function _storeFileHandle(handle) {
        openIDB().then(function (db) {
            var tx = db.transaction(IDB_STORE, 'readwrite');
            tx.objectStore(IDB_STORE).put(handle, 'site-config-filehandle');
        }).catch(function () {});
    }

    async function _writeToFileHandle(handle, content) {
        var writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
    }

    async function _saveConfigToFile(content) {
        // Try existing stored handle first
        if (_siteConfigFileHandle) {
            try {
                var perm = await _siteConfigFileHandle.queryPermission({ mode: 'readwrite' });
                if (perm !== 'granted') {
                    perm = await _siteConfigFileHandle.requestPermission({ mode: 'readwrite' });
                }
                if (perm === 'granted') {
                    await _writeToFileHandle(_siteConfigFileHandle, content);
                    return 'written';
                }
            } catch (e) {
                _siteConfigFileHandle = null; // handle stale — fall through to picker
            }
        }
        // Show file picker — ask user to navigate to their js/ folder and select site-config.js
        try {
            var handle = await window.showSaveFilePicker({
                suggestedName: 'site-config.js',
                types: [{ description: 'JavaScript file', accept: { 'application/javascript': ['.js'] } }]
            });
            _siteConfigFileHandle = handle;
            _storeFileHandle(handle);
            await _writeToFileHandle(handle, content);
            return 'written';
        } catch (e) {
            if (e.name === 'AbortError') return 'cancelled';
            throw e;
        }
    }

    // Shared save function — always downloads site-config.js reliably
    window._lvhDoSaveConfig = function (btn) {
        var content = _buildSiteConfigContent();
        var origHtml = btn ? btn.innerHTML : '';
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; }
        _downloadConfigFallback(content);
        markFileSaved();
        addAuditEntry('data_reset', 'system', 'Site configuration downloaded as site-config.js (replace file in js/ folder)');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-download"></i> Downloaded!';
            btn.style.background = 'var(--green)';
            setTimeout(function () {
                btn.innerHTML = origHtml;
                btn.style.background = '';
                btn.disabled = false;
            }, 2500);
        }
    };

    if (saveConfigBtn) {
        saveConfigBtn.addEventListener('click', function () {
            window._lvhDoSaveConfig(saveConfigBtn);
        });
    }

    var importBtn = document.getElementById('dbImportBtn');
    var importFile = document.getElementById('dbImportFile');
    if (importBtn && importFile) {
        importBtn.addEventListener('click', function () { importFile.click(); });
        importFile.addEventListener('change', function () {
            var file = importFile.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function (e) {
                try {
                    var imported = JSON.parse(e.target.result);
                    if (!imported.rates || !imported.bookings) {
                        alert('Invalid backup file — missing required data.');
                        return;
                    }
                    DATA = migrateData(imported);
                    saveData(DATA);
                    addAuditEntry('data_reset', 'system', 'Dashboard data restored from JSON backup');
                    resetRoomDropdowns();
                    renderOverview();
                    renderRooms();
                    renderMessages();
                    showRecoveryToast();
                } catch (err) {
                    alert('Could not read backup file. Please select a valid .json export.');
                }
            };
            reader.readAsText(file);
            importFile.value = '';
        });
    }


    /* =============================================
       REFRESH BUTTON
       ============================================= */
    const refreshBtn = document.getElementById('dbRefreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            addAuditEntry('data_reset', 'system', 'Dashboard data reset to defaults');
            localStorage.removeItem(STORAGE_KEY);
            // Also clear IndexedDB backup
            openIDB().then(function (db) {
                var tx = db.transaction(IDB_STORE, 'readwrite');
                tx.objectStore(IDB_STORE).delete(STORAGE_KEY);
            }).catch(function () {});
            DATA = loadData();
            resetRoomDropdowns();
            renderOverview();
            renderRooms();
            renderMessages();
            renderHomepage();
            renderNewsFeedManager();
        });
    }


    /* =============================================
       FULL WEBSITE BACKUP (ZIP Download)
       ============================================= */
    var BACKUP_FILE_MANIFEST = [
        'index.html',
        'about.html',
        'offers.html',
        'bookings.html',
        'dining.html',
        'gallery.html',
        'contact.html',
        'dashboard.html',
        'test-integration.html',
        'css/style.css',
        'css/dashboard.css',
        'js/main.js',
        'js/dashboard.js',
        'assets/tripadvisor-badge.png',
        'CLAUDE.md'
    ];

    function generateWebsiteBackup() {
        // Guard: JSZip must be loaded
        if (typeof JSZip === 'undefined') {
            alert('JSZip library not loaded. Please check your internet connection and reload the page.');
            return;
        }

        // Guard: must be served over HTTP
        if (window.location.protocol === 'file:') {
            alert('Full Backup requires the site to be served from an HTTP server (e.g. VS Code Live Server).\n\nOpening dashboard.html directly via file:// does not allow fetching project files.\n\nPlease start a local server and try again.');
            return;
        }

        var btn = document.getElementById('dbFullBackupBtn');
        if (btn) btn.disabled = true;

        // Create progress toast
        var toast = document.createElement('div');
        toast.className = 'db-backup-toast';
        toast.innerHTML =
            '<div class="db-backup-toast-icon"><i class="fas fa-spinner fa-spin"></i></div>' +
            '<div class="db-backup-toast-content">' +
                '<strong>Creating backup…</strong>' +
                '<span class="db-backup-toast-detail">0 / ' + BACKUP_FILE_MANIFEST.length + ' files</span>' +
            '</div>';
        document.body.appendChild(toast);
        // Trigger reflow then show
        toast.offsetHeight;
        toast.classList.add('show');

        var detailEl = toast.querySelector('.db-backup-toast-detail');
        var titleEl = toast.querySelector('strong');
        var iconEl = toast.querySelector('.db-backup-toast-icon i');

        var zip = new JSZip();
        var completed = 0;
        var skipped = [];
        var binaryExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg', '.woff', '.woff2'];

        function isBinary(filename) {
            var lower = filename.toLowerCase();
            for (var i = 0; i < binaryExts.length; i++) {
                if (lower.endsWith(binaryExts[i])) return true;
            }
            return false;
        }

        // Build base URL (directory of the current page)
        var baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);

        // Fetch all files
        var promises = BACKUP_FILE_MANIFEST.map(function (filePath) {
            var url = baseUrl + filePath;
            var binary = isBinary(filePath);

            return fetch(url)
                .then(function (response) {
                    if (!response.ok) {
                        skipped.push(filePath + ' (' + response.status + ')');
                        console.warn('[Backup] Skipped: ' + filePath + ' — HTTP ' + response.status);
                        completed++;
                        if (detailEl) detailEl.textContent = completed + ' / ' + BACKUP_FILE_MANIFEST.length + ' files';
                        return null;
                    }
                    return binary ? response.arrayBuffer() : response.text();
                })
                .then(function (data) {
                    if (data !== null && data !== undefined) {
                        if (binary) {
                            zip.file(filePath, data);
                        } else {
                            zip.file(filePath, data);
                        }
                        completed++;
                        if (detailEl) detailEl.textContent = completed + ' / ' + BACKUP_FILE_MANIFEST.length + ' files';
                    }
                })
                .catch(function (err) {
                    skipped.push(filePath + ' (network error)');
                    console.warn('[Backup] Failed to fetch: ' + filePath, err);
                    completed++;
                    if (detailEl) detailEl.textContent = completed + ' / ' + BACKUP_FILE_MANIFEST.length + ' files';
                });
        });

        Promise.all(promises).then(function () {
            // Add localStorage data to _backup-data/ folder
            var backupDataFolder = zip.folder('_backup-data');

            // Dashboard data
            var dashRaw = localStorage.getItem(STORAGE_KEY);
            if (dashRaw) {
                backupDataFolder.file('dashboard-data.json', dashRaw);
            }

            // Site analytics
            var analyticsRaw = localStorage.getItem(SITE_ANALYTICS_KEY);
            if (analyticsRaw) {
                backupDataFolder.file('site-analytics.json', analyticsRaw);
            }

            // Guest feedback
            var feedbackRaw = localStorage.getItem('lvh_feedback');
            if (feedbackRaw) {
                backupDataFolder.file('guest-feedback.json', feedbackRaw);
            }

            // Backup info metadata
            var now = new Date();
            var backupInfo = {
                timestamp: now.toISOString(),
                date: now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                time: now.toLocaleTimeString('en-US'),
                totalFiles: BACKUP_FILE_MANIFEST.length,
                fetchedFiles: BACKUP_FILE_MANIFEST.length - skipped.length,
                skippedFiles: skipped.length,
                skippedList: skipped,
                localStorageKeys: [STORAGE_KEY, SITE_ANALYTICS_KEY, 'lvh_feedback']
            };
            backupDataFolder.file('backup-info.json', JSON.stringify(backupInfo, null, 2));

            // Generate ZIP
            if (titleEl) titleEl.textContent = 'Compressing…';

            return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
        }).then(function (blob) {
            // Build filename with date
            var now = new Date();
            var dateStr = now.getFullYear() + '-' +
                String(now.getMonth() + 1).padStart(2, '0') + '-' +
                String(now.getDate()).padStart(2, '0');
            var filename = 'LVH-Website-Backup-' + dateStr + '.zip';

            // Download via blob URL
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(function () { URL.revokeObjectURL(url); }, 5000);

            // Size formatting
            var sizeKB = (blob.size / 1024).toFixed(1);
            var sizeStr = blob.size > 1048576
                ? (blob.size / 1048576).toFixed(1) + ' MB'
                : sizeKB + ' KB';

            var fetchedCount = BACKUP_FILE_MANIFEST.length - skipped.length;
            var skippedText = skipped.length > 0 ? ' (' + skipped.length + ' skipped)' : '';

            // Update toast to success
            toast.classList.add('success');
            iconEl.className = 'fas fa-check-circle';
            if (titleEl) titleEl.textContent = 'Backup complete!';
            if (detailEl) detailEl.textContent = fetchedCount + ' files + data • ' + sizeStr + skippedText;

            // Audit log
            addAuditEntry('website_backup', 'system', 'Full website backup downloaded — ' + fetchedCount + ' files, ' + sizeStr + skippedText);

            // Auto-dismiss after 4s
            setTimeout(function () {
                toast.classList.remove('show');
                setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 400);
            }, 4000);

            if (btn) btn.disabled = false;

        }).catch(function (err) {
            console.error('[Backup] ZIP generation failed:', err);
            toast.classList.add('error');
            iconEl.className = 'fas fa-exclamation-circle';
            if (titleEl) titleEl.textContent = 'Backup failed';
            if (detailEl) detailEl.textContent = err.message || 'An unexpected error occurred';

            setTimeout(function () {
                toast.classList.remove('show');
                setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 400);
            }, 5000);

            if (btn) btn.disabled = false;
        });
    }

    // Bind Full Backup button
    var fullBackupBtn = document.getElementById('dbFullBackupBtn');
    if (fullBackupBtn) {
        fullBackupBtn.addEventListener('click', generateWebsiteBackup);
    }


    /* =============================================
       RENDERING — Home Page (Hero Slider Manager)
       ============================================= */
    // Higher max width for hero images (they display full-width)
    function compressHeroImage(file, callback) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var img = new Image();
            img.onload = function () {
                var MAX_W = 1200;
                var w = img.width;
                var h = img.height;
                if (w > MAX_W) { h = Math.round(h * (MAX_W / w)); w = MAX_W; }
                var canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                callback(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function renderHomepage() {
        var listEl = document.getElementById('dbSlideList');
        var countEl = document.getElementById('dbSlideCount');
        if (!listEl) return;

        var slides = DATA.heroSlides || [];
        if (countEl) countEl.textContent = slides.length + ' slide' + (slides.length !== 1 ? 's' : '');

        if (slides.length === 0) {
            listEl.innerHTML = '<div style="padding:40px;text-align:center;color:var(--db-text-light)"><i class="fas fa-images" style="font-size:2rem;margin-bottom:12px;display:block;opacity:0.4"></i>No slides yet. Click "Add Slide" to create one.</div>';
            return;
        }

        listEl.innerHTML = slides.map(function (slide, idx) {
            return '<div class="db-slide-card" data-idx="' + idx + '">' +
                '<div class="db-slide-preview">' +
                    '<img src="' + slide.image + '" alt="Slide ' + (idx + 1) + '">' +
                    '<div class="db-slide-number">' + (idx + 1) + '</div>' +
                    '<label class="db-slide-upload-overlay" title="Change image">' +
                        '<i class="fas fa-camera"></i>' +
                        '<input type="file" accept="image/*" class="db-slide-file-input" data-idx="' + idx + '">' +
                    '</label>' +
                '</div>' +
                '<div class="db-slide-fields">' +
                    '<div class="db-slide-field-row">' +
                        '<div class="db-slide-field">' +
                            '<label>Label</label>' +
                            '<input type="text" class="db-slide-input" data-idx="' + idx + '" data-field="label" value="' + escAttr(slide.label) + '" placeholder="e.g. Welcome to">' +
                        '</div>' +
                        '<div class="db-slide-field">' +
                            '<label>Heading</label>' +
                            '<input type="text" class="db-slide-input" data-idx="' + idx + '" data-field="heading" value="' + escAttr(slide.heading) + '" placeholder="e.g. Lake Victoria Hotel">' +
                        '</div>' +
                    '</div>' +
                    '<div class="db-slide-field-row">' +
                        '<div class="db-slide-field">' +
                            '<label>Subtitle</label>' +
                            '<input type="text" class="db-slide-input" data-idx="' + idx + '" data-field="subtitle" value="' + escAttr(slide.subtitle) + '" placeholder="e.g. We Speak Your Language">' +
                        '</div>' +
                    '</div>' +
                    '<div class="db-slide-field-row">' +
                        '<div class="db-slide-field">' +
                            '<label>Button Text</label>' +
                            '<input type="text" class="db-slide-input" data-idx="' + idx + '" data-field="buttonText" value="' + escAttr(slide.buttonText) + '" placeholder="e.g. Book Now">' +
                        '</div>' +
                        '<div class="db-slide-field">' +
                            '<label>Button Link</label>' +
                            '<input type="text" class="db-slide-input" data-idx="' + idx + '" data-field="buttonLink" value="' + escAttr(slide.buttonLink) + '" placeholder="e.g. bookings.html">' +
                        '</div>' +
                    '</div>' +
                    '<div class="db-slide-actions">' +
                        (idx > 0 ? '<button class="db-slide-btn" data-action="up" data-idx="' + idx + '" title="Move up"><i class="fas fa-arrow-up"></i></button>' : '') +
                        (idx < slides.length - 1 ? '<button class="db-slide-btn" data-action="down" data-idx="' + idx + '" title="Move down"><i class="fas fa-arrow-down"></i></button>' : '') +
                        '<button class="db-slide-btn db-slide-btn-save" data-action="save" data-idx="' + idx + '" title="Save changes"><i class="fas fa-check"></i> Save</button>' +
                        '<button class="db-slide-btn db-slide-btn-danger" data-action="delete" data-idx="' + idx + '" title="Delete slide"><i class="fas fa-trash-alt"></i></button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        }).join('');

        // Bind events
        bindSlideEvents();
    }

    function escAttr(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function bindSlideEvents() {
        var listEl = document.getElementById('dbSlideList');
        if (!listEl) return;

        // File uploads with specs validation
        var HERO_MIN_W = 1200;
        var HERO_MIN_H = 600;
        var HERO_MAX_MB = 8;
        var HERO_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

        listEl.querySelectorAll('.db-slide-file-input').forEach(function (input) {
            input.addEventListener('change', function () {
                var idx = parseInt(this.dataset.idx);
                var file = this.files[0];
                if (!file) return;

                // Format check
                if (HERO_FORMATS.indexOf(file.type) === -1) {
                    alert('Unsupported format: ' + (file.type || 'unknown') + '\n\nAccepted formats: JPEG, PNG, or WebP.');
                    this.value = '';
                    return;
                }

                // File size check
                var sizeMB = file.size / (1024 * 1024);
                if (sizeMB > HERO_MAX_MB) {
                    alert('File too large: ' + sizeMB.toFixed(1) + ' MB\n\nMaximum file size: ' + HERO_MAX_MB + ' MB.\nPlease compress or resize the image before uploading.');
                    this.value = '';
                    return;
                }

                // Dimension check (read image first)
                var reader = new FileReader();
                reader.onload = function (e) {
                    var img = new Image();
                    img.onload = function () {
                        var w = img.width;
                        var h = img.height;
                        if (w < HERO_MIN_W || h < HERO_MIN_H) {
                            var proceed = confirm(
                                'Image Resolution Warning\n\n' +
                                'Your image is ' + w + ' x ' + h + ' pixels.\n' +
                                'Recommended minimum: ' + HERO_MIN_W + ' x ' + HERO_MIN_H + ' pixels.\n\n' +
                                'A low-resolution image may appear blurry on the home page hero slider, especially on large screens.\n\n' +
                                'Upload anyway?'
                            );
                            if (!proceed) return;
                        }

                        // Aspect ratio advisory
                        var ratio = w / h;
                        if (ratio < 1.5 || ratio > 3.0) {
                            var proceed2 = confirm(
                                'Aspect Ratio Notice\n\n' +
                                'Your image has a ' + ratio.toFixed(2) + ':1 aspect ratio.\n' +
                                'Recommended: landscape format between 16:9 and 21:9 (1.78:1 to 2.33:1).\n\n' +
                                'The image will be cropped to fit the slider. Parts of the image may be cut off.\n\n' +
                                'Upload anyway?'
                            );
                            if (!proceed2) return;
                        }

                        compressHeroImage(file, function (dataUrl) {
                            DATA.heroSlides[idx].image = dataUrl;
                            saveData(DATA);
                            addAuditEntry('room_content_edit', 'room', 'Hero slide ' + (idx + 1) + ' image updated (' + w + 'x' + h + ', ' + sizeMB.toFixed(1) + 'MB)');
                            renderHomepage();
                        });
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            });
        });

        // Save buttons & text inputs
        listEl.querySelectorAll('.db-slide-btn[data-action="save"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var idx = parseInt(this.dataset.idx);
                var card = listEl.querySelector('.db-slide-card[data-idx="' + idx + '"]');
                if (!card) return;
                card.querySelectorAll('.db-slide-input').forEach(function (inp) {
                    DATA.heroSlides[idx][inp.dataset.field] = inp.value;
                });
                saveData(DATA);
                addAuditEntry('room_content_edit', 'room', 'Hero slide ' + (idx + 1) + ' text updated');
                // Visual feedback
                btn.innerHTML = '<i class="fas fa-check"></i> Saved!';
                btn.classList.add('saved');
                setTimeout(function () {
                    btn.innerHTML = '<i class="fas fa-check"></i> Save';
                    btn.classList.remove('saved');
                }, 1500);
            });
        });

        // Move up/down
        listEl.querySelectorAll('.db-slide-btn[data-action="up"], .db-slide-btn[data-action="down"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var idx = parseInt(this.dataset.idx);
                var dir = this.dataset.action === 'up' ? -1 : 1;
                var target = idx + dir;
                if (target < 0 || target >= DATA.heroSlides.length) return;
                var temp = DATA.heroSlides[idx];
                DATA.heroSlides[idx] = DATA.heroSlides[target];
                DATA.heroSlides[target] = temp;
                saveData(DATA);
                addAuditEntry('room_content_edit', 'room', 'Hero slide reordered: ' + (idx + 1) + ' \u2194 ' + (target + 1));
                renderHomepage();
            });
        });

        // Delete
        listEl.querySelectorAll('.db-slide-btn[data-action="delete"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var idx = parseInt(this.dataset.idx);
                if (!confirm('Delete slide ' + (idx + 1) + '? This cannot be undone.')) return;
                DATA.heroSlides.splice(idx, 1);
                saveData(DATA);
                addAuditEntry('room_content_edit', 'room', 'Hero slide ' + (idx + 1) + ' deleted');
                renderHomepage();
            });
        });
    }

    // Add Slide button
    var addSlideBtn = document.getElementById('dbAddSlide');
    if (addSlideBtn) {
        addSlideBtn.addEventListener('click', function () {
            var newId = 'slide' + Date.now().toString(36);
            DATA.heroSlides.push({
                id: newId,
                image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80',
                label: 'Your Label',
                heading: 'Your Heading',
                subtitle: 'Your subtitle text here',
                buttonText: 'Book Now',
                buttonLink: 'bookings.html'
            });
            saveData(DATA);
            addAuditEntry('room_content_edit', 'room', 'New hero slide added (total: ' + DATA.heroSlides.length + ')');
            renderHomepage();
        });
    }


    /* =============================================
       RENDERING — News Feed Manager
       ============================================= */
    var NEWS_CATEGORIES = ['Hotel News', 'Events', 'Awards', 'Dining', 'Offers'];

    function renderNewsFeedManager() {
        var listEl = document.getElementById('dbNewsList');
        var countEl = document.getElementById('dbNewsCount');
        if (!listEl) return;

        var items = DATA.newsFeeds || [];
        if (countEl) countEl.textContent = items.length + ' item' + (items.length !== 1 ? 's' : '');

        if (items.length === 0) {
            listEl.innerHTML = '<div style="padding:40px;text-align:center;color:var(--db-text-light)"><i class="fas fa-newspaper" style="font-size:2rem;margin-bottom:12px;display:block;opacity:0.4"></i>No news items yet. Click "Add News" to create one.</div>';
            return;
        }

        listEl.innerHTML = items.map(function (item, idx) {
            var catOptions = NEWS_CATEGORIES.map(function (cat) {
                return '<option value="' + escAttr(cat) + '"' + (item.category === cat ? ' selected' : '') + '>' + cat + '</option>';
            }).join('');

            return '<div class="db-slide-card db-news-card" data-idx="' + idx + '">' +
                '<div class="db-slide-preview db-news-preview">' +
                    '<img src="' + (item.image || '') + '" alt="News ' + (idx + 1) + '">' +
                    '<label class="db-slide-upload-overlay" title="Change image">' +
                        '<i class="fas fa-camera"></i>' +
                        '<input type="file" accept="image/*" class="db-news-file-input" data-idx="' + idx + '">' +
                    '</label>' +
                '</div>' +
                '<div class="db-slide-fields">' +
                    '<div class="db-slide-field-row">' +
                        '<div class="db-slide-field" style="flex:2">' +
                            '<label>Title</label>' +
                            '<input type="text" class="db-slide-input db-news-input" data-idx="' + idx + '" data-field="title" value="' + escAttr(item.title) + '" placeholder="News headline">' +
                        '</div>' +
                    '</div>' +
                    '<div class="db-slide-field-row">' +
                        '<div class="db-slide-field" style="flex:2">' +
                            '<label>Excerpt</label>' +
                            '<textarea class="db-slide-input db-news-excerpt" data-idx="' + idx + '" data-field="excerpt" rows="3" placeholder="Short description...">' + escAttr(item.excerpt) + '</textarea>' +
                        '</div>' +
                    '</div>' +
                    '<div class="db-slide-field-row">' +
                        '<div class="db-slide-field">' +
                            '<label>Date</label>' +
                            '<input type="date" class="db-slide-input db-news-date" data-idx="' + idx + '" data-field="date" value="' + (item.date || '') + '">' +
                        '</div>' +
                        '<div class="db-slide-field">' +
                            '<label>Category</label>' +
                            '<select class="db-slide-input db-news-category" data-idx="' + idx + '" data-field="category">' + catOptions + '</select>' +
                        '</div>' +
                    '</div>' +
                    '<div class="db-slide-actions">' +
                        (idx > 0 ? '<button class="db-slide-btn" data-action="up" data-idx="' + idx + '" title="Move up"><i class="fas fa-arrow-up"></i></button>' : '') +
                        (idx < items.length - 1 ? '<button class="db-slide-btn" data-action="down" data-idx="' + idx + '" title="Move down"><i class="fas fa-arrow-down"></i></button>' : '') +
                        '<button class="db-slide-btn db-slide-btn-save db-news-save" data-action="save" data-idx="' + idx + '" title="Save changes"><i class="fas fa-check"></i> Save</button>' +
                        '<button class="db-slide-btn db-slide-btn-danger" data-action="delete" data-idx="' + idx + '" title="Delete news item"><i class="fas fa-trash-alt"></i></button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        }).join('');

        bindNewsEvents();
    }

    function bindNewsEvents() {
        var listEl = document.getElementById('dbNewsList');
        if (!listEl) return;

        var NEWS_MAX_MB = 8;
        var NEWS_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

        // File uploads
        listEl.querySelectorAll('.db-news-file-input').forEach(function (input) {
            input.addEventListener('change', function () {
                var idx = parseInt(this.dataset.idx);
                var file = this.files[0];
                if (!file) return;

                if (NEWS_FORMATS.indexOf(file.type) === -1) {
                    alert('Unsupported format. Accepted: JPEG, PNG, or WebP.');
                    this.value = '';
                    return;
                }

                var sizeMB = file.size / (1024 * 1024);
                if (sizeMB > NEWS_MAX_MB) {
                    alert('File too large: ' + sizeMB.toFixed(1) + ' MB. Maximum: ' + NEWS_MAX_MB + ' MB.');
                    this.value = '';
                    return;
                }

                compressHeroImage(file, function (dataUrl) {
                    DATA.newsFeeds[idx].image = dataUrl;
                    saveData(DATA);
                    addAuditEntry('news_feed_edit', 'content', 'News item ' + (idx + 1) + ' image updated');
                    renderNewsFeedManager();
                });
            });
        });

        // Save buttons
        listEl.querySelectorAll('.db-news-save').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var idx = parseInt(this.dataset.idx);
                var card = listEl.querySelector('.db-news-card[data-idx="' + idx + '"]');
                if (!card) return;

                card.querySelectorAll('.db-news-input, .db-news-excerpt, .db-news-date, .db-news-category').forEach(function (inp) {
                    DATA.newsFeeds[idx][inp.dataset.field] = inp.value;
                });

                saveData(DATA);
                addAuditEntry('news_feed_edit', 'content', 'News item "' + DATA.newsFeeds[idx].title + '" updated');

                btn.innerHTML = '<i class="fas fa-check"></i> Saved!';
                btn.classList.add('saved');
                setTimeout(function () {
                    btn.innerHTML = '<i class="fas fa-check"></i> Save';
                    btn.classList.remove('saved');
                }, 1500);
            });
        });

        // Move up/down
        listEl.querySelectorAll('.db-slide-btn[data-action="up"], .db-slide-btn[data-action="down"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var idx = parseInt(this.dataset.idx);
                var dir = this.dataset.action === 'up' ? -1 : 1;
                var target = idx + dir;
                if (target < 0 || target >= DATA.newsFeeds.length) return;
                var temp = DATA.newsFeeds[idx];
                DATA.newsFeeds[idx] = DATA.newsFeeds[target];
                DATA.newsFeeds[target] = temp;
                saveData(DATA);
                addAuditEntry('news_feed_edit', 'content', 'News item reordered: ' + (idx + 1) + ' \u2194 ' + (target + 1));
                renderNewsFeedManager();
            });
        });

        // Delete
        listEl.querySelectorAll('.db-slide-btn[data-action="delete"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var idx = parseInt(this.dataset.idx);
                var title = DATA.newsFeeds[idx].title || 'item ' + (idx + 1);
                if (!confirm('Delete "' + title + '"? This cannot be undone.')) return;
                DATA.newsFeeds.splice(idx, 1);
                saveData(DATA);
                addAuditEntry('news_feed_edit', 'content', 'News item "' + title + '" deleted');
                renderNewsFeedManager();
            });
        });
    }

    // Add News button
    var addNewsBtn = document.getElementById('dbAddNews');
    if (addNewsBtn) {
        addNewsBtn.addEventListener('click', function () {
            var today = new Date().toISOString().split('T')[0];
            DATA.newsFeeds.push({
                id: 'nf' + Date.now().toString(36),
                image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
                title: 'New Announcement',
                excerpt: 'Write a short description for this news item.',
                date: today,
                category: 'Hotel News'
            });
            saveData(DATA);
            addAuditEntry('news_feed_edit', 'content', 'New news item added (total: ' + DATA.newsFeeds.length + ')');
            renderNewsFeedManager();
        });
    }


    /* =============================================
       RENDERING — Offers Page Manager
       ============================================= */
    var OFFERS_IMG_MAX_MB = 8;

    function renderOffersPage() {
        renderFacilitiesManager();
        renderPackagesManager();
    }

    function renderFacilitiesManager() {
        var listEl = document.getElementById('dbFacilitiesList');
        if (!listEl) return;
        var items = DATA.facilities || [];

        listEl.innerHTML = items.map(function (item, idx) {
            return '<div class="db-slide-card db-offers-card" data-idx="' + idx + '" data-type="fac">' +
                '<div class="db-slide-preview db-news-preview">' +
                    '<img src="' + escAttr(item.image || '') + '" alt="' + escAttr(item.title) + '">' +
                    '<label class="db-slide-upload-overlay" title="Change image">' +
                        '<i class="fas fa-camera"></i>' +
                        '<input type="file" accept="image/jpeg,image/png,image/webp" class="db-offers-file-input" data-idx="' + idx + '" data-type="fac">' +
                    '</label>' +
                '</div>' +
                '<div class="db-slide-fields">' +
                    '<div class="db-slide-field-row">' +
                        '<div class="db-slide-field">' +
                            '<label>Tag Label</label>' +
                            '<input type="text" class="db-slide-input db-offers-input" data-field="tag" value="' + escAttr(item.tag || '') + '" placeholder="e.g. Relax">' +
                        '</div>' +
                        '<div class="db-slide-field" style="flex:2">' +
                            '<label>Title</label>' +
                            '<input type="text" class="db-slide-input db-offers-input" data-field="title" value="' + escAttr(item.title || '') + '" placeholder="Facility name">' +
                        '</div>' +
                    '</div>' +
                    '<div class="db-slide-field-row">' +
                        '<div class="db-slide-field" style="flex:1">' +
                            '<label>Description</label>' +
                            '<textarea class="db-slide-input db-offers-input" data-field="description" rows="3" placeholder="Short description...">' + escHtml(item.description || '') + '</textarea>' +
                        '</div>' +
                    '</div>' +
                    '<div class="db-slide-field-row">' +
                        '<div class="db-slide-field">' +
                            '<label>Button Text</label>' +
                            '<input type="text" class="db-slide-input db-offers-input" data-field="linkText" value="' + escAttr(item.linkText || 'Enquire') + '">' +
                        '</div>' +
                        '<div class="db-slide-field" style="flex:2">' +
                            '<label>Button Link</label>' +
                            '<input type="text" class="db-slide-input db-offers-input" data-field="link" value="' + escAttr(item.link || 'contact.html') + '">' +
                        '</div>' +
                    '</div>' +
                    '<div class="db-slide-actions">' +
                        '<button class="db-slide-btn db-slide-btn-save db-offers-save" data-idx="' + idx + '" data-type="fac"><i class="fas fa-check"></i> Save</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        }).join('');

        bindOffersEvents('fac', listEl, DATA.facilities, 'offers_edit', 'Facility card', renderFacilitiesManager);
    }

    function renderPackagesManager() {
        var listEl = document.getElementById('dbPackagesList');
        if (!listEl) return;
        var items = DATA.packages || [];

        listEl.innerHTML = items.map(function (item, idx) {
            var inc = item.includes || ['', '', '', ''];
            var includesHtml = [0, 1, 2, 3].map(function (i) {
                return '<div class="db-slide-field">' +
                    '<label>Include ' + (i + 1) + '</label>' +
                    '<input type="text" class="db-slide-input db-offers-input db-pkg-include" data-idx-include="' + i + '" value="' + escAttr(inc[i] || '') + '" placeholder="Included item ' + (i + 1) + '">' +
                '</div>';
            }).join('');

            return '<div class="db-slide-card db-offers-card" data-idx="' + idx + '" data-type="pkg">' +
                '<div class="db-slide-preview db-news-preview">' +
                    '<img src="' + escAttr(item.image || '') + '" alt="' + escAttr(item.title) + '">' +
                    '<label class="db-slide-upload-overlay" title="Change image">' +
                        '<i class="fas fa-camera"></i>' +
                        '<input type="file" accept="image/jpeg,image/png,image/webp" class="db-offers-file-input" data-idx="' + idx + '" data-type="pkg">' +
                    '</label>' +
                '</div>' +
                '<div class="db-slide-fields">' +
                    '<div class="db-slide-field-row">' +
                        '<div class="db-slide-field">' +
                            '<label>Badge (optional)</label>' +
                            '<input type="text" class="db-slide-input db-offers-input" data-field="badge" value="' + escAttr(item.badge || '') + '" placeholder="e.g. Popular">' +
                        '</div>' +
                        '<div class="db-slide-field" style="flex:2">' +
                            '<label>Title</label>' +
                            '<input type="text" class="db-slide-input db-offers-input" data-field="title" value="' + escAttr(item.title || '') + '" placeholder="Package name">' +
                        '</div>' +
                    '</div>' +
                    '<div class="db-slide-field-row">' +
                        '<div class="db-slide-field" style="flex:1">' +
                            '<label>Description</label>' +
                            '<textarea class="db-slide-input db-offers-input" data-field="description" rows="2" placeholder="Short description...">' + escHtml(item.description || '') + '</textarea>' +
                        '</div>' +
                    '</div>' +
                    '<div class="db-slide-field-row">' + includesHtml + '</div>' +
                    '<div class="db-slide-actions">' +
                        '<button class="db-slide-btn db-slide-btn-save db-offers-save" data-idx="' + idx + '" data-type="pkg"><i class="fas fa-check"></i> Save</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        }).join('');

        bindOffersEvents('pkg', listEl, DATA.packages, 'offers_edit', 'Package card', renderPackagesManager);
    }

    /* =============================================
       ABOUT PAGE — Management Team Manager
       ============================================= */
    function renderAboutPage() {
        renderSurroundingsManager();
        renderManagementTeamManager();
    }

    function renderSurroundingsManager() {
        var listEl = document.getElementById('dbSurroundingsList');
        if (!listEl) return;
        var items = DATA.surroundings || [];

        if (!items.length) {
            listEl.innerHTML = '<div class="db-empty-state"><i class="fas fa-map-marker-alt"></i><p>No surroundings yet. Click <strong>Add Location</strong> to get started.</p></div>';
        } else {
            listEl.innerHTML = items.map(function (item, idx) {
                return '<div class="db-slide-card" data-sur-idx="' + idx + '" style="margin-bottom:12px">' +
                    '<div class="db-slide-fields">' +
                        '<div class="db-slide-field-row">' +
                            '<div class="db-slide-field" style="flex:0 0 130px">' +
                                '<label>Icon <small style="color:#aaa">(FA class)</small></label>' +
                                '<div style="display:flex;align-items:center;gap:8px">' +
                                    '<i class="fas ' + escAttr(item.icon || 'fa-map-marker-alt') + '" style="color:var(--gold);font-size:1.1rem;width:18px;text-align:center" id="surIconPreview' + idx + '"></i>' +
                                    '<input type="text" class="db-slide-input db-sur-input" data-field="icon" value="' + escAttr(item.icon || 'fa-map-marker-alt') + '" placeholder="fa-map-marker-alt" style="font-size:0.78rem">' +
                                '</div>' +
                            '</div>' +
                            '<div class="db-slide-field" style="flex:2">' +
                                '<label>Title</label>' +
                                '<input type="text" class="db-slide-input db-sur-input" data-field="title" value="' + escAttr(item.title || '') + '" placeholder="e.g. Lake Victoria">' +
                            '</div>' +
                        '</div>' +
                        '<div class="db-slide-field-row">' +
                            '<div class="db-slide-field" style="flex:1">' +
                                '<label>Description</label>' +
                                '<textarea class="db-slide-input db-sur-input" data-field="description" rows="2" placeholder="Short description...">' + escHtml(item.description || '') + '</textarea>' +
                            '</div>' +
                        '</div>' +
                        '<div class="db-slide-actions">' +
                            '<button class="db-slide-btn db-slide-btn-save db-sur-save" data-idx="' + idx + '"><i class="fas fa-check"></i> Save</button>' +
                            '<button class="db-slide-btn db-slide-btn-delete db-sur-delete" data-idx="' + idx + '"><i class="fas fa-trash"></i> Remove</button>' +
                        '</div>' +
                    '</div>' +
                '</div>';
            }).join('');
        }

        bindSurroundingsEvents(listEl);

        var addBtn = document.getElementById('dbAddSurroundingBtn');
        if (addBtn && !addBtn._surBound) {
            addBtn._surBound = true;
            addBtn.addEventListener('click', function () {
                if (!DATA.surroundings) DATA.surroundings = [];
                DATA.surroundings.push({ id: 'sur' + Date.now(), icon: 'fa-map-marker-alt', title: 'New Location', description: '' });
                saveData(DATA);
                addAuditEntry('about_edit', 'content', 'New surrounding location added');
                renderSurroundingsManager();
            });
        }
    }

    function bindSurroundingsEvents(listEl) {
        // Live icon preview on input
        listEl.querySelectorAll('.db-sur-input[data-field="icon"]').forEach(function (inp) {
            inp.addEventListener('input', function () {
                var idx = this.closest('[data-sur-idx]').dataset.surIdx;
                var preview = document.getElementById('surIconPreview' + idx);
                if (preview) {
                    preview.className = 'fas ' + (this.value.trim() || 'fa-map-marker-alt');
                }
            });
        });

        // Save buttons
        listEl.querySelectorAll('.db-sur-save').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var idx = parseInt(this.dataset.idx);
                var card = listEl.querySelector('[data-sur-idx="' + idx + '"]');
                if (!card || !DATA.surroundings[idx]) return;
                card.querySelectorAll('.db-sur-input[data-field]').forEach(function (inp) {
                    DATA.surroundings[idx][inp.dataset.field] = inp.value;
                });
                saveData(DATA);
                addAuditEntry('about_edit', 'content', '"' + (DATA.surroundings[idx].title || 'Location') + '" surrounding updated');
                var b = btn;
                b.innerHTML = '<i class="fas fa-check"></i> Saved!';
                b.style.background = '#22c55e';
                setTimeout(function () { b.innerHTML = '<i class="fas fa-check"></i> Save'; b.style.background = ''; }, 1800);
            });
        });

        // Delete buttons
        listEl.querySelectorAll('.db-sur-delete').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var idx = parseInt(this.dataset.idx);
                var title = (DATA.surroundings[idx] && DATA.surroundings[idx].title) || 'this location';
                if (!confirm('Remove "' + title + '" from Location & Surroundings?')) return;
                DATA.surroundings.splice(idx, 1);
                saveData(DATA);
                addAuditEntry('about_edit', 'content', '"' + title + '" removed from surroundings');
                renderSurroundingsManager();
            });
        });
    }

    function renderManagementTeamManager() {
        var listEl = document.getElementById('dbMgmtTeamList');
        if (!listEl) return;
        var items = DATA.managementTeam || [];

        if (!items.length) {
            listEl.innerHTML = '<div class="db-empty-state"><i class="fas fa-users"></i><p>No team members yet. Click <strong>Add Member</strong> to get started.</p></div>';
        } else {
            listEl.innerHTML = items.map(function (item, idx) {
                return '<div class="db-slide-card db-mgmt-card" data-idx="' + idx + '">' +
                    '<div class="db-slide-preview db-mgmt-preview">' +
                        '<img src="' + escAttr(item.image || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80') + '" alt="' + escAttr(item.name || '') + '">' +
                        '<label class="db-slide-upload-overlay" title="Change photo">' +
                            '<i class="fas fa-camera"></i>' +
                            '<input type="file" accept="image/jpeg,image/png,image/webp" class="db-mgmt-file-input" data-idx="' + idx + '">' +
                        '</label>' +
                    '</div>' +
                    '<div class="db-slide-fields">' +
                        '<div class="db-slide-field-row">' +
                            '<div class="db-slide-field" style="flex:2">' +
                                '<label>Full Name</label>' +
                                '<input type="text" class="db-slide-input db-mgmt-input" data-field="name" value="' + escAttr(item.name || '') + '" placeholder="e.g. David Ssekabira">' +
                            '</div>' +
                            '<div class="db-slide-field" style="flex:2">' +
                                '<label>Title / Role</label>' +
                                '<input type="text" class="db-slide-input db-mgmt-input" data-field="role" value="' + escAttr(item.role || '') + '" placeholder="e.g. General Manager">' +
                            '</div>' +
                        '</div>' +
                        '<div class="db-slide-field-row">' +
                            '<div class="db-slide-field" style="flex:1">' +
                                '<label>Bio</label>' +
                                '<textarea class="db-slide-input db-mgmt-input" data-field="bio" rows="3" placeholder="Short bio...">' + escHtml(item.bio || '') + '</textarea>' +
                            '</div>' +
                        '</div>' +
                        '<div class="db-slide-actions">' +
                            '<button class="db-slide-btn db-slide-btn-save db-mgmt-save" data-idx="' + idx + '"><i class="fas fa-check"></i> Save</button>' +
                            '<button class="db-slide-btn db-slide-btn-delete db-mgmt-delete" data-idx="' + idx + '"><i class="fas fa-trash"></i> Remove</button>' +
                        '</div>' +
                    '</div>' +
                '</div>';
            }).join('');
        }

        bindMgmtEvents(listEl);

        var addBtn = document.getElementById('dbAddMgmtBtn');
        if (addBtn && !addBtn._mgmtBound) {
            addBtn._mgmtBound = true;
            addBtn.addEventListener('click', function () {
                if (!DATA.managementTeam) DATA.managementTeam = [];
                DATA.managementTeam.push({
                    id: 'mgmt' + Date.now(),
                    name: 'New Team Member',
                    role: 'Position Title',
                    bio: '',
                    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80'
                });
                saveData(DATA);
                addAuditEntry('about_edit', 'content', 'New management team member added');
                renderManagementTeamManager();
            });
        }
    }

    function bindMgmtEvents(listEl) {
        // Photo uploads
        listEl.querySelectorAll('.db-mgmt-file-input').forEach(function (input) {
            input.addEventListener('change', function () {
                var idx = parseInt(this.dataset.idx);
                var file = this.files[0];
                if (!file) return;
                if (file.size / 1048576 > OFFERS_IMG_MAX_MB) {
                    alert('File too large. Max ' + OFFERS_IMG_MAX_MB + ' MB.');
                    this.value = '';
                    return;
                }
                var preview = this.closest('.db-slide-preview').querySelector('img');
                compressHeroImage(file, function (dataUrl) {
                    DATA.managementTeam[idx].image = dataUrl;
                    if (preview) preview.src = dataUrl;
                    saveData(DATA);
                    addAuditEntry('about_edit', 'content', 'Team member photo updated');
                });
            });
        });

        // Save buttons
        listEl.querySelectorAll('.db-mgmt-save').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var idx = parseInt(this.dataset.idx);
                var card = listEl.querySelector('.db-mgmt-card[data-idx="' + idx + '"]');
                if (!card || !DATA.managementTeam[idx]) return;
                card.querySelectorAll('.db-mgmt-input[data-field]').forEach(function (inp) {
                    DATA.managementTeam[idx][inp.dataset.field] = inp.value;
                });
                saveData(DATA);
                addAuditEntry('about_edit', 'content', '"' + (DATA.managementTeam[idx].name || 'Member') + '" profile updated');
                var b = btn;
                b.innerHTML = '<i class="fas fa-check"></i> Saved!';
                b.style.background = '#22c55e';
                setTimeout(function () { b.innerHTML = '<i class="fas fa-check"></i> Save'; b.style.background = ''; }, 1800);
            });
        });

        // Delete buttons
        listEl.querySelectorAll('.db-mgmt-delete').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var idx = parseInt(this.dataset.idx);
                var name = (DATA.managementTeam[idx] && DATA.managementTeam[idx].name) || 'this member';
                if (!confirm('Remove "' + name + '" from the management team?')) return;
                DATA.managementTeam.splice(idx, 1);
                saveData(DATA);
                addAuditEntry('about_edit', 'content', '"' + name + '" removed from management team');
                renderManagementTeamManager();
            });
        });
    }

    function bindOffersEvents(type, listEl, dataArr, auditType, auditLabel, rerender) {
        // Image uploads
        listEl.querySelectorAll('.db-offers-file-input[data-type="' + type + '"]').forEach(function (input) {
            input.addEventListener('change', function () {
                var idx = parseInt(this.dataset.idx);
                var file = this.files[0];
                if (!file) return;
                if (file.size / 1048576 > OFFERS_IMG_MAX_MB) {
                    alert('File too large (' + (file.size / 1048576).toFixed(1) + ' MB). Max ' + OFFERS_IMG_MAX_MB + ' MB.');
                    this.value = '';
                    return;
                }
                var preview = this.closest('.db-slide-preview').querySelector('img');
                compressHeroImage(file, function (dataUrl) {
                    dataArr[idx].image = dataUrl;
                    if (preview) preview.src = dataUrl;
                    saveData(DATA);
                    addAuditEntry(auditType, 'content', auditLabel + ' ' + (idx + 1) + ' image updated');
                });
            });
        });

        // Save buttons
        listEl.querySelectorAll('.db-offers-save[data-type="' + type + '"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var idx = parseInt(this.dataset.idx);
                var card = listEl.querySelector('.db-offers-card[data-idx="' + idx + '"][data-type="' + type + '"]');
                if (!card) return;

                // Text/textarea fields
                card.querySelectorAll('.db-offers-input[data-field]').forEach(function (inp) {
                    dataArr[idx][inp.dataset.field] = inp.value;
                });

                // Package includes bullet points
                if (type === 'pkg') {
                    var incs = card.querySelectorAll('.db-pkg-include');
                    dataArr[idx].includes = Array.from(incs).map(function (i) { return i.value; }).filter(function (v) { return v.trim(); });
                }

                saveData(DATA);
                addAuditEntry(auditType, 'content', auditLabel + ' ' + (idx + 1) + ' updated: ' + (dataArr[idx].title || ''));
                var origHtml = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i> Saved!';
                btn.classList.add('saved');
                setTimeout(function () { btn.innerHTML = origHtml; btn.classList.remove('saved'); }, 1500);
            });
        });
    }


    /* =============================================
       RENDERING — Reports
       ============================================= */
    let reportDateRange = 'month';

    /* =============================================
       DINING MENU MANAGER
       ============================================= */
    var MENU_CATS = [
        { key: 'food',     label: 'Food Menu',    icon: 'fa-utensils' },
        { key: 'drinks',   label: 'Drinks Menu',  icon: 'fa-glass-martini-alt' },
        { key: 'snacks',   label: 'Light Snacks', icon: 'fa-cookie-bite' },
        { key: 'desserts', label: 'Desserts',      icon: 'fa-ice-cream' },
        { key: 'mains',    label: 'Main Courses', icon: 'fa-drumstick-bite' },
        { key: 'starters', label: 'Starters',      icon: 'fa-leaf' }
    ];

    function renderDiningPage() {
        var listEl = document.getElementById('dbMenuFilesList');
        if (!listEl) return;
        if (!DATA.menuFiles) DATA.menuFiles = { food: null, drinks: null, snacks: null, desserts: null, mains: null, starters: null };

        listEl.innerHTML = MENU_CATS.map(function (cat) {
            var file = DATA.menuFiles[cat.key];
            var hasFile = file && file.data;
            var previewHtml = hasFile ? _menuFilePreviewHtml(file) : '';
            return '<div class="db-surcharge-row" style="align-items:flex-start;gap:16px;padding:14px 0;border-bottom:1px solid #f0f0f0" id="dbMenuRow-' + cat.key + '">' +
                '<div style="display:flex;align-items:center;gap:10px;min-width:148px">' +
                    '<i class="fas ' + cat.icon + '" style="color:var(--gold);width:18px;text-align:center"></i>' +
                    '<strong style="font-size:0.88rem">' + cat.label + '</strong>' +
                '</div>' +
                '<div style="flex:1;min-width:0">' +
                    '<div id="dbMenuPreview-' + cat.key + '" style="margin-bottom:' + (hasFile ? '10px' : '0') + '">' + previewHtml + '</div>' +
                    '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
                        '<label class="db-btn db-btn-primary db-btn-sm" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px">' +
                            '<i class="fas fa-folder-open"></i> ' + (hasFile ? 'Replace' : 'Upload') +
                            '<input type="file" class="db-menu-file-inp" data-cat="' + cat.key + '" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" style="display:none">' +
                        '</label>' +
                        (hasFile ? '<button class="db-btn db-btn-outline db-btn-sm db-menu-file-clear" data-cat="' + cat.key + '" style="color:#ef4444;border-color:#ef4444"><i class="fas fa-trash"></i> Remove</button>' : '') +
                        '<span style="font-size:0.8rem;color:#aaa">' + (hasFile ? escHtml(file.name) : 'No file uploaded') + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>';
        }).join('');

        _bindMenuFileEvents(listEl);
    }

    function _menuFilePreviewHtml(file) {
        var isPdf = (file.type === 'application/pdf') || (file.name || '').toLowerCase().endsWith('.pdf');
        if (isPdf) {
            return '<div style="display:inline-flex;align-items:center;gap:10px;padding:8px 12px;background:#fff8f8;border:1px solid #fdd;border-radius:6px">' +
                '<i class="fas fa-file-pdf" style="font-size:1.6rem;color:#ef4444"></i>' +
                '<span style="font-size:0.8rem;color:#555">' + escHtml(file.name || 'menu.pdf') + '</span>' +
            '</div>';
        }
        return '<img src="' + escAttr(file.data) + '" alt="preview" style="height:60px;border-radius:6px;border:1px solid #e0e0e0;object-fit:contain">';
    }

    function _bindMenuFileEvents(listEl) {
        listEl.querySelectorAll('.db-menu-file-inp').forEach(function (input) {
            input.addEventListener('change', function () {
                var key = this.dataset.cat;
                var file = this.files[0];
                if (!file) return;
                if (file.size > 100 * 1048576) {
                    alert('File too large. Please choose a file under 100 MB.');
                    this.value = '';
                    return;
                }
                var reader = new FileReader();
                reader.onload = function (e) {
                    if (!DATA.menuFiles) DATA.menuFiles = {};
                    DATA.menuFiles[key] = { name: file.name, type: file.type, data: e.target.result };
                    saveData(DATA);
                    addAuditEntry('menu_edit', 'content', escHtml(file.name) + ' uploaded for ' + key + ' menu');
                    renderDiningPage();
                };
                reader.readAsDataURL(file);
            });
        });

        listEl.querySelectorAll('.db-menu-file-clear').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var key = this.dataset.cat;
                var catLabel = (MENU_CATS.find(function(c){ return c.key === key; }) || {}).label || key;
                if (!confirm('Remove the file for ' + catLabel + '?')) return;
                DATA.menuFiles[key] = null;
                saveData(DATA);
                addAuditEntry('menu_edit', 'content', catLabel + ' menu file removed');
                renderDiningPage();
            });
        });
    }

    function renderReports() {
        var now = new Date();
        var todayStr = now.toISOString().split('T')[0];

        // Date range display in banner
        var dateRangeEl = document.getElementById('dbReportDateRange');
        if (dateRangeEl) {
            dateRangeEl.textContent = getDateRangeLabel(reportDateRange);
        }

        // --- Revenue from bookings in selected period ---
        var periodStart, periodEnd;
        if (reportDateRange === 'all') {
            periodStart = '2000-01-01';
            periodEnd = '2100-01-01';
        } else if (reportDateRange === 'month') {
            periodStart = todayStr.substring(0, 7) + '-01';
            var nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            periodEnd = nextMonth.toISOString().split('T')[0];
        } else {
            var days = parseInt(reportDateRange) || 30;
            var startDate = new Date(now);
            startDate.setDate(startDate.getDate() - days);
            periodStart = startDate.toISOString().split('T')[0];
            periodEnd = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
        }

        var activeBookings = DATA.bookings.filter(function (b) { return b.status !== 'cancelled'; });
        var periodRev = 0;
        activeBookings.forEach(function (b) {
            var nights = overlapNights(b.checkin, b.checkout, periodStart, periodEnd);
            if (nights > 0) {
                var rate = DATA.rates[b.room] || ROOM_PRICES[b.room] || 0;
                periodRev += rate * nights;
            }
        });
        setTextById('reportRevenue', '$' + periodRev.toLocaleString());

        // --- Event counts from filtered analytics ---
        var allEvents = loadSiteAnalytics();
        var events = filterEventsByRange(allEvents, reportDateRange);
        var counts = { booking_confirmed: 0, page_view: 0, room_book_click: 0, contact_enquiry: 0 };
        events.forEach(function (e) { if (counts[e.event] !== undefined) counts[e.event]++; });

        setTextById('reportBookings', counts.booking_confirmed);
        setTextById('reportSiteVisits', counts.page_view);
        setTextById('reportBookClicks', counts.room_book_click);
        setTextById('reportEnquiries', counts.contact_enquiry);

        // Guest rating — always all-time
        var gr = DATA.guestRating || { average: 0, count: 0 };
        setTextById('reportGuestRating', gr.count > 0 ? gr.average.toFixed(1) + ' / 5' : 'No ratings');

        // --- Site Activity Chart ---
        renderReportChart();

        // Report contents preview (5 items)
        var contentsEl = document.getElementById('dbReportContents');
        if (contentsEl) {
            var items = [
                { icon: 'fa-tags', title: 'Room Rates', desc: 'Current pricing for all room types including custom rooms' },
                { icon: 'fa-dollar-sign', title: 'Revenue Summary', desc: 'Booking revenue for the selected period' },
                { icon: 'fa-globe', title: 'Site Activity', desc: 'Website visits, clicks, enquiries, emails, and feedback' },
                { icon: 'fa-chart-line', title: 'Activity Trend', desc: 'Daily site activity chart for the selected period' },
                { icon: 'fa-star', title: 'Guest Rating', desc: 'Average rating and total review count' }
            ];
            contentsEl.innerHTML = items.map(function (item) {
                return '<div class="db-report-item">' +
                    '<div class="db-report-item-icon"><i class="fas ' + item.icon + '"></i></div>' +
                    '<div><strong>' + item.title + '</strong><p>' + item.desc + '</p></div>' +
                '</div>';
            }).join('');
        }

        // Bind PDF buttons
        var dlBtn = document.getElementById('dbDownloadReport');
        if (dlBtn) {
            dlBtn.onclick = function () { generatePDFReport('download'); };
        }
        var pvBtn = document.getElementById('dbPreviewReport');
        if (pvBtn) {
            pvBtn.onclick = function () { generatePDFReport('preview'); };
        }

        // Attach filter
        attachReportFilter();
    }

    function renderReportChart() {
        var allEvents = loadSiteAnalytics();
        var now = new Date();
        var numDays = reportDateRange === 'all' ? 30 : (reportDateRange === 'month' ? Math.max(2, Math.ceil((now - new Date(now.getFullYear(), now.getMonth(), 1)) / 86400000) + 1) : parseInt(reportDateRange));
        var days = [];
        for (var i = numDays - 1; i >= 0; i--) {
            var d = new Date(now);
            d.setDate(d.getDate() - i);
            var dateStr = d.toISOString().split('T')[0];
            var count = allEvents.filter(function (e) { return e.timestamp && e.timestamp.split('T')[0] === dateStr; }).length;
            days.push({ date: dateStr, count: count });
        }
        drawLineChart(
            'dbReportChart',
            days,
            function (d) { var dt = new Date(d.date); return (dt.getMonth() + 1) + '/' + dt.getDate(); },
            function (d) { return d.count; },
            '',
            '#2c6e49'
        );
    }

    function attachReportFilter() {
        var filterBar = document.getElementById('dbReportDateFilter');
        if (!filterBar || filterBar._bound) return;
        filterBar._bound = true;
        var pills = filterBar.querySelectorAll('.db-pill');
        pills.forEach(function (pill) {
            pill.addEventListener('click', function () {
                pills.forEach(function (b) { b.classList.remove('active'); });
                pill.classList.add('active');
                reportDateRange = pill.dataset.range;
                renderReports();
            });
        });
    }

    function generatePDFReport(mode) {
        mode = mode || 'download';
        if (typeof window.jspdf === 'undefined') {
            alert('PDF library is still loading. Please try again in a moment.');
            return;
        }

        var jsPDF = window.jspdf.jsPDF;
        var doc = new jsPDF('p', 'mm', 'a4');
        var pageW = 210;
        var pageH = 297;
        var margin = 18;
        var contentW = pageW - margin * 2;
        var y = 0;

        // Colors
        var greenDark = [30, 77, 51];
        var gold = [201, 168, 76];
        var white = [255, 255, 255];
        var textDark = [51, 51, 51];
        var textLight = [107, 114, 128];
        var bgLight = [244, 245, 247];

        // Page check helper
        function checkPage(needed) {
            if (y + needed > pageH - 30) {
                // Footer on current page
                drawFooter();
                doc.addPage();
                y = 20;
            }
        }

        // Footer
        function drawFooter() {
            doc.setFillColor.apply(doc, greenDark);
            doc.rect(0, pageH - 16, pageW, 16, 'F');
            doc.setFontSize(7);
            doc.setTextColor.apply(doc, white);
            doc.text('Lake Victoria Hotel  |  Plot 1-3 Entebbe Rd, Entebbe, Uganda  |  +256-312310100  |  reservations@lvhotel.co.ug  |  WhatsApp: +256-772268040', pageW / 2, pageH - 7, { align: 'center' });
        }

        // Section title
        function sectionTitle(title) {
            checkPage(18);
            doc.setFillColor.apply(doc, gold);
            doc.rect(margin, y, 4, 8, 'F');
            doc.setFontSize(13);
            doc.setTextColor.apply(doc, greenDark);
            doc.setFont('helvetica', 'bold');
            doc.text(title, margin + 8, y + 6);
            y += 14;
        }

        // Key-value row
        function kvRow(label, value) {
            checkPage(8);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor.apply(doc, textLight);
            doc.text(label, margin + 4, y);
            doc.setTextColor.apply(doc, textDark);
            doc.setFont('helvetica', 'bold');
            doc.text(String(value), margin + contentW - 4, y, { align: 'right' });
            y += 7;
        }

        // ===== HEADER BAR =====
        doc.setFillColor.apply(doc, greenDark);
        doc.rect(0, 0, pageW, 36, 'F');
        doc.setFillColor.apply(doc, gold);
        doc.rect(0, 36, pageW, 2, 'F');
        doc.setFontSize(22);
        doc.setTextColor.apply(doc, white);
        doc.setFont('helvetica', 'bold');
        doc.text('LAKE VICTORIA HOTEL', pageW / 2, 17, { align: 'center' });
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor.apply(doc, gold);
        doc.text('HOTEL PERFORMANCE REPORT', pageW / 2, 27, { align: 'center' });

        y = 48;

        // Report date + period
        var now = new Date();
        var todayStr = now.toISOString().split('T')[0];
        doc.setFontSize(9);
        doc.setTextColor.apply(doc, textLight);
        doc.text('Generated: ' + fmtDate(todayStr) + ' at ' + now.toLocaleTimeString(), margin, y);
        y += 7;
        doc.text('Period: ' + getDateRangeLabel(reportDateRange), margin, y);
        y += 12;

        // ===== SECTION 1: Room Rates =====
        sectionTitle('1. Room Rates');

        var allTypes = getAllRoomTypes();
        checkPage(10);
        doc.setFillColor.apply(doc, bgLight);
        doc.rect(margin, y - 4, contentW, 8, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor.apply(doc, greenDark);
        doc.text('Room Type', margin + 4, y);
        doc.text('Rate / Night', margin + contentW - 4, y, { align: 'right' });
        y += 8;

        allTypes.forEach(function (key) {
            checkPage(8);
            var rate = DATA.rates[key] || ROOM_PRICES[key] || 0;
            var name = getDisplayName(key);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor.apply(doc, textDark);
            doc.text(name, margin + 4, y);
            doc.setTextColor.apply(doc, gold);
            doc.setFont('helvetica', 'bold');
            doc.text('$' + rate, margin + contentW - 4, y, { align: 'right' });
            doc.setDrawColor(226, 229, 234);
            doc.setLineWidth(0.2);
            doc.line(margin, y + 2, margin + contentW, y + 2);
            y += 7;
        });
        y += 4;

        // ===== SECTION 2: Revenue Summary =====
        sectionTitle('2. Revenue Summary');

        var pdfPeriodStart, pdfPeriodEnd;
        if (reportDateRange === 'all') {
            pdfPeriodStart = '2000-01-01';
            pdfPeriodEnd = '2100-01-01';
        } else if (reportDateRange === 'month') {
            pdfPeriodStart = todayStr.substring(0, 7) + '-01';
            var nextM = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            pdfPeriodEnd = nextM.toISOString().split('T')[0];
        } else {
            var daysN = parseInt(reportDateRange) || 30;
            var sd = new Date(now);
            sd.setDate(sd.getDate() - daysN);
            pdfPeriodStart = sd.toISOString().split('T')[0];
            pdfPeriodEnd = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
        }

        var pdfActiveBookings = DATA.bookings.filter(function (b) { return b.status !== 'cancelled'; });
        var pdfRev = 0;
        var pdfNights = 0;
        pdfActiveBookings.forEach(function (b) {
            var nights = overlapNights(b.checkin, b.checkout, pdfPeriodStart, pdfPeriodEnd);
            if (nights > 0) {
                var rate = DATA.rates[b.room] || ROOM_PRICES[b.room] || 0;
                pdfRev += rate * nights;
                pdfNights += nights;
            }
        });
        kvRow('Total Revenue', '$' + pdfRev.toLocaleString());
        kvRow('Room Nights Sold', String(pdfNights));
        kvRow('Avg. Daily Rate', pdfNights > 0 ? '$' + Math.round(pdfRev / pdfNights) : '$0');
        y += 4;

        // ===== SECTION 3: Site Activity =====
        sectionTitle('3. Site Activity');

        var siteEvents = loadSiteAnalytics();
        var filteredEvents = filterEventsByRange(siteEvents, reportDateRange);
        var siteCounts = { page_view: 0, room_book_click: 0, contact_enquiry: 0, booking_confirmed: 0, pdf_download: 0, guest_feedback: 0 };
        filteredEvents.forEach(function (ev) {
            if (siteCounts.hasOwnProperty(ev.event)) siteCounts[ev.event]++;
        });

        kvRow('Site Visits', String(siteCounts.page_view));
        kvRow('Book Now Clicks', String(siteCounts.room_book_click));
        kvRow('Contact Enquiries', String(siteCounts.contact_enquiry));
        kvRow('Booking Emails', String(siteCounts.booking_confirmed));
        kvRow('PDF Downloads', String(siteCounts.pdf_download));
        kvRow('Guest Feedback', String(siteCounts.guest_feedback));
        y += 4;

        // ===== SECTION 4: Guest Rating =====
        sectionTitle('4. Guest Rating');

        var gr = DATA.guestRating || { average: 0, count: 0 };
        kvRow('Average Rating', gr.count > 0 ? gr.average.toFixed(1) + ' / 5.0' : 'No ratings yet');
        kvRow('Total Reviews', String(gr.count));

        if (gr.count > 0) {
            checkPage(10);
            var stars = '';
            for (var s = 1; s <= 5; s++) {
                stars += s <= Math.round(gr.average) ? '\u2605' : '\u2606';
            }
            doc.setFontSize(16);
            doc.setTextColor.apply(doc, gold);
            doc.text(stars, margin + 4, y + 2);
            y += 10;
        }

        // ===== FOOTER =====
        drawFooter();

        // Output
        var filename = 'LVH-Performance-Report-' + todayStr + '.pdf';
        if (mode === 'preview') {
            var blobUrl = doc.output('bloburl');
            openReportPreview(blobUrl, filename);
        } else {
            doc.save(filename);
        }
    }

    // --- PDF Preview Modal ---
    var _previewBlobUrl = null;
    var _previewFilename = null;

    function openReportPreview(blobUrl, filename) {
        _previewBlobUrl = blobUrl;
        _previewFilename = filename;
        var overlay = document.getElementById('dbPdfPreviewOverlay');
        var frame = document.getElementById('dbPdfPreviewFrame');
        if (!overlay || !frame) return;
        frame.src = blobUrl;
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Bind modal buttons (once)
        var dlBtn = document.getElementById('dbPreviewDownload');
        if (dlBtn) {
            dlBtn.onclick = function () {
                if (_previewBlobUrl && _previewFilename) {
                    var a = document.createElement('a');
                    a.href = _previewBlobUrl;
                    a.download = _previewFilename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }
            };
        }
        var closeBtn = document.getElementById('dbPreviewClose');
        if (closeBtn) {
            closeBtn.onclick = closeReportPreview;
        }

        // Backdrop click
        overlay.onclick = function (e) {
            if (e.target === overlay) closeReportPreview();
        };

        // Escape key
        document.addEventListener('keydown', _previewEscHandler);
    }

    function _previewEscHandler(e) {
        if (e.key === 'Escape') closeReportPreview();
    }

    function closeReportPreview() {
        var overlay = document.getElementById('dbPdfPreviewOverlay');
        var frame = document.getElementById('dbPdfPreviewFrame');
        if (overlay) overlay.classList.remove('active');
        if (frame) frame.src = '';
        document.body.style.overflow = '';
        document.removeEventListener('keydown', _previewEscHandler);
        if (_previewBlobUrl) {
            URL.revokeObjectURL(_previewBlobUrl);
            _previewBlobUrl = null;
        }
        _previewFilename = null;
    }


    /* =============================================
       RESPONSIVE CHART REDRAW
       ============================================= */
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const activeSection = document.querySelector('.db-section.active');
            if (!activeSection) return;
            const id = activeSection.id.replace('sec-', '');
            if (id === 'overview') {
                var chartDays = overviewDateRange === 'all' ? 30 : (overviewDateRange === 'month' ? Math.ceil((new Date() - new Date(new Date().getFullYear(), new Date().getMonth(), 1)) / 86400000) + 1 : parseInt(overviewDateRange));
                renderOverviewActivityChart(chartDays);
            }
            if (id === 'analytics') renderRevenueChart();
            if (id === 'audit') renderAuditSection();
            if (id === 'reports') renderReportChart();
        }, 200);
    });


    /* =============================================
       INIT
       ============================================= */
    renderOverview();
    updateUnsavedBanner();

})();
