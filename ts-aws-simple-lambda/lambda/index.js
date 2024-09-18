exports.handler = async (context) => {
  
  const length = process.env.MY_LENGTH;
  const width = process.env.MY_WIDTH;
  let area = calculateArea(length, width);
  console.log(`The area is ${area}`);
        
  console.log('CloudWatch log group: ', context.logGroupName);
  
  let data = {
    "area": area,
  };
    return JSON.stringify(data);
    
  function calculateArea(length, width) {
    return length * width;
  }
};
