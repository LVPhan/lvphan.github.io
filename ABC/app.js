function calculateTotal() {
    const bidAmount = parseFloat(document.getElementById('bidAmount').value);
    const buyerPremiumRate = 0.15; // 15% buyer premium
    const salesTaxRate = 0.08375; // 8.375% Las Vegas sales tax
    
    if (isNaN(bidAmount) || bidAmount <= 0) {
      alert('Please enter a valid bid amount.');
      return;
    }
  
    // Calculate buyer premium
    const buyerPremium = bidAmount * buyerPremiumRate;
    
    // Calculate sales tax
    const salesTax = bidAmount * salesTaxRate;
  
    // Calculate total cost
    const totalCost = bidAmount + buyerPremium + salesTax;
  
    // Display the result
    document.getElementById('result').textContent = `Total Cost: $${totalCost.toFixed(2)}`;
  }
  
