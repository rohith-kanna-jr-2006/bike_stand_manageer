async function testBooking() {
    try {
        // 1. Fetch Stands
        console.log('Fetching stands...');
        const standsRes = await fetch('http://localhost:3002/api/stands');
        const standsData = await standsRes.json();

        if (!standsData.success || !standsData.data || standsData.data.length === 0) {
            throw new Error('No stands found');
        }

        const stand = standsData.data[0];
        console.log('Selected Stand:', stand._id, stand.name);

        // 2. Create Booking
        const bookingPayload = {
            userId: 'test_user_123',
            userName: 'Test User',
            stand: stand._id,
            standName: stand.name,
            standOwnerId: stand.ownerId,
            vehicleType: 'two-wheeler',
            vehicleNumber: 'TEST-001',
            vehicleModel: 'Test Model',
            status: 'active',
            totalAmount: 0
        };

        console.log('Creating booking with payload:', bookingPayload);

        const bookingRes = await fetch('http://localhost:3002/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingPayload)
        });

        const bookingData = await bookingRes.json();
        console.log('Booking Response Success:', bookingData.success);
        console.log('Booking Response Error:', bookingData.error);

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testBooking();
