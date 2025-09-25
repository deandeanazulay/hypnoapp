const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (import.meta.env.DEV) {
      console.log('[CSS-ORB] Touch end event triggered, calling onTap');
    }
    onTap();
  };