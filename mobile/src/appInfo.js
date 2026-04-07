export const APP_INFO = {
  appName: "ShopEase",
  course: "SE2020 – Web and Mobile Technologies",
  assignment: "Full Stack Mobile Application (Group Assignment)",
  groupNumber: "XX", // TODO: replace with your group number
  githubRepoUrl: "https://github.com/your-repo-link", // TODO: replace
  backendUrl: "https://your-api-link", // TODO: replace (hosted backend URL)
  team: [
    {
      memberNo: 1,
      studentId: "IT24101814",
      name: "Wijegunarathna R S H",
      module: "Product Management (CRUD + multiple image upload)",
      entity: "Product",
      imageResponsibility: "Multiple product image upload pipeline (Multer + Cloudinary/local), validation, return URLs",
    },
    {
      memberNo: 2,
      studentId: "IT24100950",
      name: "Gunarathnam C V",
      module: "Cart Management (CRUD + proof image upload)",
      entity: "Cart",
      imageResponsibility: "Single proof image upload for cart (Multer), validation, preview in UI",
    },
    {
      memberNo: 3,
      studentId: "IT24100760",
      name: "Lekamge N Y M",
      module: "Order Management (CRUD + status flow + linked image display)",
      entity: "Order",
      imageResponsibility: "Show linked Product/Payment/Delivery images; aggregate image display in Order details",
    },
    {
      memberNo: 4,
      studentId: "IT24101680",
      name: "Janith K H M",
      module: "Payment Management (CRUD + receipt image upload)",
      entity: "Payment",
      imageResponsibility: "Single receipt image upload (Multer), validation, preview in UI",
    },
    {
      memberNo: 5,
      studentId: "IT24101277",
      name: "Kirtharan M",
      module: "Delivery Management (CRUD + proof image upload + tracking)",
      entity: "Delivery",
      imageResponsibility: "Single delivery proof image upload when Delivered; show preview + status timeline",
    },
    {
      memberNo: 6,
      studentId: "IT24100687",
      name: "Sansiri P S T",
      module: "Review & Rating (CRUD + review images upload; post-delivery restriction)",
      entity: "Review",
      imageResponsibility: "Multiple review image upload (max 3), validation, show in Product details",
    },
  ],
};

