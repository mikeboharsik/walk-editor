export default function VideoElement({ setCurrentTime, setVidOffset, setVidZoom, vidOffset, vidSrc, vidZoom }) {
	return (vidSrc && (
		<video
			onDoubleClick={(e) => e.preventDefault()}
			onTimeUpdate={(e) => {setCurrentTime(e.target.currentTime)}}
			id="wip-video"
			src={vidSrc}
			controls
			controlsList="nofullscreen"
			style={{ marginBottom: '2.5em', display: 'inline-block', scale: vidZoom, translate: `${vidOffset[0]}px ${vidOffset[1]}px`, width: '100%' }}
			onWheel={(e) => {
				if (e.ctrlKey) {
					let newVal = vidZoom;   
					if (e.nativeEvent.wheelDeltaY > 0) {
						newVal = Math.min(10.0, vidZoom + 1);
					} else {
						newVal = Math.max(1.0, vidZoom - 1);
						if (newVal === 1) {
							setVidOffset([0, 0]);
						}
					}
					setVidZoom(newVal);
				}
			}}
			onContextMenu={(e) => e.preventDefault()}
			onMouseMove={(e) => { if (e.shiftKey) setVidOffset(([x, y]) => ([x + e.movementX, y + e.movementY]))}}
		></video>
	)) || null;
}
