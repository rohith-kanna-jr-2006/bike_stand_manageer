# Backend Implementation Guide

To support the frontend ticket display which requires User Name and Stand Name, update the `getTicketById` controller in your Node/Express backend.

## Mongoose Query Update

When fetching the ticket, use `.populate()` to include referenced documents from the `User` and `Stand` collections.

```javascript
// controllers/ticketController.js

const getTicketById = async (req, res) => {
  try {
    const ticketId = req.params.id;

    // FIND ticket by ID
    // POPULATE 'user' to get the name
    // POPULATE 'stand' to get the stand name/address
    const ticket = await Ticket.findById(ticketId)
      .populate('user', 'name email') // Only fetch fields you need
      .populate('stand', 'name address'); // Only fetch fields you need

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
```

## Data Structure Expected by Frontend

Ensure the response JSON matches the structure the `TicketView` component expects, or map it accordingly in the frontend API call:

```json
{
  "_id": "ticket_id_123",
  "user": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "stand": {
    "name": "Central Station Hub",
    "address": "123 Main St"
  },
  "vehicleType": "bike",
  "vehicleNumber": "TN-01-1234",
  "checkInTime": "2023-10-25T10:00:00.000Z"
}
```