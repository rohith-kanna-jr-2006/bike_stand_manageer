async function checkStands() {
    try {
        const response = await fetch('http://localhost:3002/api/stands');
        const data = await response.json();
        if (data.success && data.data) {
            data.data.forEach(stand => {
                console.log(stand._id);
            });
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

checkStands();
