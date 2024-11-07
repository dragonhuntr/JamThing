type VolumeChangeListener = (volumeDelta: number) => void;
type ToggleViewListener = () => void;

class ButtonControls {
    private static instance: ButtonControls;
    private volumeChangeListeners: VolumeChangeListener[];
    private toggleViewListeners: ToggleViewListener[];

    private constructor() {
        this.volumeChangeListeners = [];
        this.toggleViewListeners = [];
        this.registerWheelEventListener();
        this.registerKeyboardEventListener();
    }

    static getInstance(): ButtonControls {
        if (!ButtonControls.instance) {
            ButtonControls.instance = new ButtonControls();
        }
        return ButtonControls.instance;
    }

    private registerWheelEventListener() {
        document.addEventListener('wheel', this.wheelEventHandler);
    }

    private registerKeyboardEventListener() {
        document.addEventListener('keydown', this.keyboardEventHandler);
    }

    private wheelEventHandler = (event: WheelEvent) => {
        const volumeDelta = event.deltaX > 0 ? 5 : -5;
        this.notifyVolumeChange(volumeDelta);
    };

    private keyboardEventHandler = (event: KeyboardEvent) => {
        switch (event.key) {
            case '1':
                this.notifyToggleView(); // Notify listeners to toggle view
                break;
            case '2':
                // Placeholder for action when '2' is pressed
                break;
            case '3':
                // Placeholder for action when '3' is pressed
                break;
            case '4':
                this.notifyJamInit();
                break;
            default:
                return;
        }
    };

    private notifyToggleView() {
        this.toggleViewListeners.forEach(listener => listener());
    }

    onToggleView(listener: ToggleViewListener): () => void {
        this.toggleViewListeners.push(listener);
        return () => this.removeToggleViewListener(listener);
    }

    private removeToggleViewListener(listener: ToggleViewListener) {
        this.toggleViewListeners = this.toggleViewListeners.filter(l => l !== listener);
    }

    private notifyJamInit() {
        this.jamInitListeners.forEach(listener => listener());
    }

    private jamInitListeners: (() => void)[] = [];

    onJamInit(listener: () => void): () => void {
        this.jamInitListeners.push(listener);
        return () => this.removeJamInitListener(listener);
    }

    private removeJamInitListener(listener: () => void) {
        this.jamInitListeners = this.jamInitListeners.filter(l => l !== listener);
    }

    private notifyVolumeChange(volumeDelta: number) {
        this.volumeChangeListeners.forEach(listener => listener(volumeDelta));
    }

    onVolumeChange(listener: VolumeChangeListener): () => void {
        this.volumeChangeListeners.push(listener);
        return () => this.removeVolumeChangeListener(listener);
    }

    private removeVolumeChangeListener(listener: VolumeChangeListener) {
        this.volumeChangeListeners = this.volumeChangeListeners.filter(l => l !== listener);
    }

    destroy() {
        document.removeEventListener('wheel', this.wheelEventHandler);
        document.removeEventListener('keydown', this.keyboardEventHandler);
        this.volumeChangeListeners = [];
        this.toggleViewListeners = [];
    }
}

export default ButtonControls.getInstance();