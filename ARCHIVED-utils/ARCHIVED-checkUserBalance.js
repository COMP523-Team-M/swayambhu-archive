const checkUserBalance = async () => {
    try {
      const balanceResponse = await axios.get(SUBEASY_API_URL_BALANCE, {
        headers: {
          'apikey': SUBEASY_API_KEY,
        },
      });
  
      console.log("Balance response:", balanceResponse.data);
  
      if (balanceResponse.data.code !== 1) {
        throw new Error(`Failed to retrieve balance: ${balanceResponse.data.message}`);
      }
  
      const remainingCredits = balanceResponse.data.credits;
      console.log(`Remaining Credits after upload: ${remainingCredits}`);
      return remainingCredits;
    } catch (error) {
      console.error("Error retrieving balance:", error.response?.data || error.message);
      throw new Error("Failed to check user balance");
    }
  };
  