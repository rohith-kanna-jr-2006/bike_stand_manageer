async function testBooking() {
    const bookingData = {
        userId: "test_user_123",
        userName: "Test User",
        stand: "692827790ba08aaa3f6e0055", // Note: Backend expects 'stand', frontend was sending 'standId' but I fixed it to send 'stand' in the fetch body
        standName: "Test Stand",
        standOwnerId: "owner_123",
        vehicleType: "two-wheeler",
        vehicleNumber: "TEST-123",
        vehicleModel: "Test Model",
        status: "active",
        totalAmount: 0
    };

    try {
        const response = await fetch('http://localhost:3001/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingData),
        });

        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

testBooking();
