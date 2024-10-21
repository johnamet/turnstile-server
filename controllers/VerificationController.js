import Tickets from '../services/tickets';

class VerificationController {
  static async verifyTicket(req, res) {
    const {
      // eslint-disable-next-line no-unused-vars
      deviceKey, time, qrcode, imgBase64, temperature, temperatureState,
    } = req.body;

    // Validate the input data
    if (!deviceKey || !time || !qrcode) {
      return res.status(400).json({ success: false, msg: 'Missing required parameters' });
    }

    try {
    // Verify the ticket using the Tickets service
      const verificationResult = await Tickets.verifyTicket(qrcode, deviceKey, time);

      // Respond with the verification result
      return res.status(200).json({
        success: true,
        code: deviceKey,
        data: verificationResult,
        result: 1,
        msg: 'success',
      });
    } catch (error) {
      console.error(`Error verifying ticket: ${error.message}`);

      // Return a response based on the type of error
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default VerificationController;
