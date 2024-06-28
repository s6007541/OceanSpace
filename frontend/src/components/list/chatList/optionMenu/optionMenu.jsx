import './optionMenu.css';

const OptionMenu = ({ position, onClose, onShowUserId, onDeleteChat }) => {
  return (
    <div className="optionMenu" style={{ top: position.y, left: position.x }}>
      <ul>
        <li onClick={onShowUserId}>Show User ID</li>
        <li onClick={onDeleteChat}>Delete Chat</li>
        <li onClick={onClose}>Close</li>
      </ul>
    </div>
  );
};

export default OptionMenu;
