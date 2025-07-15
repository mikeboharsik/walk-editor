import { useState } from 'react';

import currentTimeToTimestamp from '../util/currentTimeToTimestamp';
import timestampToCurrentTime from '../util/timestampToCurrentTime';

function jumpToTime() {
  const targetTime = document.querySelector('#jump-to-time').value;
  document.querySelector('#wip-video').currentTime = timestampToCurrentTime(targetTime);
}

export default function VideoPreview({ revert }) {
	const [vidSrc, setVidSrc] = useState(null);
	const [vidZoom, setVidZoom] = useState(1.0);
	const [vidOffset, setVidOffset] = useState([0, 0]);
	const [currentTime, setCurrentTime] = useState(0);

	return (
		<>
			<div
				id="video-container"
				style={{
					height: '100vh',
					overflow: 'hidden',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					flexDirection: 'column',
				}}
			>
				<div>
					{revert && <span style={{ textShadow: '0px 0px 4px black', position: 'absolute', cursor: 'pointer', top: '2.5%', zIndex: 10 }} onClick={revert}>{'←'}</span>}
				</div>
				{vidSrc && <video
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
				></video>}
				{!vidSrc && <input type="file" onChange={(e) => {
					const url = URL.createObjectURL(e.target.files[0]);
					setVidSrc(url);
				}}></input>}

				<div
					id="video-controls-container"
					style={{ position: 'absolute', bottom: '0.5em' }}
				>
					<div>
						<button onClick={() => {
							setVidZoom(1.0);
							setVidOffset([0, 0]);
						}}>Reset video transforms</button>
					</div>
					<div>
						<input onKeyDown={(e) => e.key === 'Enter' && jumpToTime()} type="text" id="jump-to-time" defaultValue={'00:00:00'}></input>
					</div>
					<div>
						<button onClick={() => document.querySelector('#wip-video').currentTime -= 1.0}>{'<-'}</button>
						<button onClick={() => document.querySelector('#wip-video').currentTime -= (1 / 59.94)}>{'<'}</button>
						<input type="text" value={currentTimeToTimestamp(currentTime)} readOnly></input>
						<button onClick={() => document.querySelector('#wip-video').currentTime += (1 / 59.94)}>{'>'}</button>
						<button onClick={() => document.querySelector('#wip-video').currentTime += 1.0}>{'->'}</button>
					</div>
				</div>
			</div>
		</>
	);
}