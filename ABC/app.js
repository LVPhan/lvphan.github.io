// Function to calculate the total
function calculateTotal() {
  const bidAmount = parseFloat(document.getElementById('bidAmount').value);
  const buyerPremiumRate = 0.15; // 15% buyer premium
  const salesTaxRate = 0.08375; // 8.375% Las Vegas sales tax
  
  if (isNaN(bidAmount) || bidAmount <= 0) {
    document.getElementById('result').textContent = "Total Cost: $0.00";
    return;
  }

  // Calculate buyer premium
  const buyerPremium = bidAmount * buyerPremiumRate;
  
  // Calculate sales tax
  const salesTax = (bidAmount + buyerPremium) * salesTaxRate;

  // Calculate total cost
  const totalCost = bidAmount + buyerPremium + salesTax;

  // Add the animation class to trigger the money subtraction animation
  const resultElement = document.getElementById('result');
  
  // Reset animation by removing the class and forcing a reflow
  resultElement.classList.remove('money-subtract');
  
  // Trigger reflow
  void resultElement.offsetWidth;
  
  // Add the class to trigger the animation again
  resultElement.classList.add('money-subtract');
  
  // Display the result in red and with the calculated total cost
  resultElement.textContent = `Total Cost: $${totalCost.toFixed(2)}`;
}
  
// Add event listener for input field to calculate the total as the user types
document.getElementById('bidAmount').addEventListener('input', calculateTotal);

// Prevent zooming on input focus and reset zoom on blur
document.getElementById('bidAmount').addEventListener('focus', function () {
  document.body.style.zoom = "1";  // Prevent zooming when input is focused
});

document.getElementById('bidAmount').addEventListener('blur', function () {
  document.body.style.zoom = "1";  // Reset zoom when input is blurred
});
