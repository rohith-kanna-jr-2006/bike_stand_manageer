export const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
};

export const validatePhone = (phone) => {
    // Basic E.164-like validation: + followed by 10-15 digits
    const re = /^\+[1-9]\d{10,14}$/;
    return re.test(phone);
};

export const validatePassword = (password) => {
    // Min 8 chars, at least one number and one char
    const re = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return re.test(password);
};
