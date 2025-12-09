export const getColorVariants = async (productId) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Return color variants data based on product category
  const variants = {
    "men's clothing": [
      { color: "Coffee", image: "https://assets.ajio.com/medias/sys_master/root/20250604/tPqr/683ffc177a6cd4182f81a64a/-473Wx593H-701567363-coffee-MODEL.jpg" },
      { color: "Blue", image: "https://assets.ajio.com/medias/sys_master/root/20230728/1lwz/64c3d4d0eebac147fc92e137/-473Wx593H-469327131-blue-MODEL2.jpg" },
      { color: "Black", image: "https://assets.ajio.com/medias/sys_master/root/20230215/sbS7/63ed0b7caeb26924e3743d55/-473Wx593H-469327131-black-MODEL2.jpg" },
      { color: "Olive", image: "https://assets.ajio.com/medias/sys_master/root/20230728/PejW/64c3d366eebac147fc92d7e8/-473Wx593H-469327131-olive-MODEL2.jpg" }
    ],
    "women's clothing": [
      { color: "Pink", image: "https://fakestoreapi.com/img/51Y5NI-I5jL._AC_UX679_.jpg" },
      { color: "Purple", image: "https://fakestoreapi.com/img/71z3kpMAYsL._AC_UY879_.jpg" },
      { color: "Red", image: "https://fakestoreapi.com/img/51p2WG8s5xL._AC_UY879_.jpg" },
      { color: "Black", image: "https://fakestoreapi.com/img/61sbMiUnoGL._AC_UL640_QL65_ML3_.jpg" },
      { color: "White", image: "https://fakestoreapi.com/img/71pWzhdJNwL._AC_UL640_QL65_ML3_.jpg" }
    ],
    "jewelery": [
      { color: "Gold", image: "https://fakestoreapi.com/img/71pWzhdJNwL._AC_UL640_QL65_ML3_.jpg" },
      { color: "Silver", image: "https://fakestoreapi.com/img/61sbMiUnoGL._AC_UL640_QL65_ML3_.jpg" },
      { color: "Rose Gold", image: "https://fakestoreapi.com/img/51Y5NI-I5jL._AC_UX679_.jpg" },
      { color: "Platinum", image: "https://fakestoreapi.com/img/71z3kpMAYsL._AC_UY879_.jpg" },
      { color: "White Gold", image: "https://fakestoreapi.com/img/51p2WG8s5xL._AC_UY879_.jpg" }
    ],
    "electronics": [
      { color: "Black", image: "https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg" },
      { color: "White", image: "https://fakestoreapi.com/img/71-3HjGNDUL._AC_SY879._SX._UX._SY._UY_.jpg" },
      { color: "Space Gray", image: "https://fakestoreapi.com/img/71li-ujtlUL._AC_UX679_.jpg" },
      { color: "Silver", image: "https://fakestoreapi.com/img/71pWzhdJNwL._AC_UL640_QL65_ML3_.jpg" },
      { color: "Blue", image: "https://fakestoreapi.com/img/61sbMiUnoGL._AC_UL640_QL65_ML3_.jpg" }
    ]
  };

  // Default variants for any category not specified
  const defaultVariants = [
    { color: "Red", image: "https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg" },
    { color: "Blue", image: "https://fakestoreapi.com/img/71-3HjGNDUL._AC_SY879._SX._UX._SY._UY_.jpg" },
    { color: "Green", image: "https://fakestoreapi.com/img/71li-ujtlUL._AC_UX679_.jpg" },
    { color: "Black", image: "https://fakestoreapi.com/img/71pWzhdJNwL._AC_UL640_QL65_ML3_.jpg" },
    { color: "White", image: "https://fakestoreapi.com/img/61sbMiUnoGL._AC_UL640_QL65_ML3_.jpg" }
  ];

  return variants[productId] || defaultVariants;
}; 