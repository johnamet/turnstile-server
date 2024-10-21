/**
 * The door service sends a post request to turnstile
 * device to open door
 */
import axios from 'axios';

class Door {
  static async openDoor(deviceIp, devicePassword) {
    try {
      const response = await axios.post(`http://${deviceIp}:8090/device/openDoor`, {
        pass: devicePassword,
        type: 1,
      });

      if (response.data.success) {
        console.log('Door opened successfully');
      } else {
        console.log('Failed to open the door');
      }
    } catch (error) {
      console.log(`Error opening the door. ${error}`);
    }
  }
}

export default Door;
