// import React, { useState, useRef } from 'react';
// import './ChatbotWidget.css';

// const ChatbotWidget: React.FC = () => {
//   const [open, setOpen] = useState(false);
//   const [position, setPosition] = useState({ x: 30, y: 30 }); 
//   const [dragging, setDragging] = useState(false);
//   const offset = useRef({ x: 0, y: 0 });

//   const startDrag = (e: React.MouseEvent<HTMLDivElement>) => {
//     setDragging(true);
//     offset.current = {
//       x: e.clientX - position.x,
//       y: e.clientY - position.y,
//     };
//   };

//   const onDrag = (e: React.MouseEvent<HTMLDivElement>) => {
//     if (dragging) {
//       setPosition({
//         x: e.clientX - offset.current.x,
//         y: e.clientY - offset.current.y,
//       });
//     }
//   };

//   const stopDrag = () => setDragging(false);

//   return (
//     <div
//       className="chatbot-widget"
//       style={{
//         right: position.x,
//         bottom: position.y,
//         position: 'fixed',
//         zIndex: 9999,
//         cursor: dragging ? 'move' : 'pointer',
//       }}
//       onMouseMove={onDrag}
//       onMouseUp={stopDrag}
//       onMouseLeave={stopDrag}
//     >
//       {open ? (
//         <div className="chatbot-popup">
//           <div
//             className="chatbot-header"
//             onMouseDown={startDrag}
//             style={{ cursor: 'move' }}
//           >
//             <span>JuaLearn Assistant</span>
//             <button className="close-btn" onClick={() => setOpen(false)}>
//               ×
//             </button>
//           </div>
//           <div className="chatbot-body">
//             {/* Replace below with your chatbot implementation (iframe, component, etc) */}
//             <iframe
//               src="https://your-chatbot-url" // Replace with your actual chatbot URL or component
//               title="Chatbot"
//               width="320"
//               height="400"
//               style={{ border: 'none' }}
//             />
//           </div>
//         </div>
//       ) : (
//         <button className="chatbot-open-btn" onClick={() => setOpen(true)}>
//           💬
//         </button>
//       )}
//     </div>
//   );
// };

// export default ChatbotWidget;
