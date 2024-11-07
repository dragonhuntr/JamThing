import { Icons } from './Icons';

interface JamProps {
    visible: boolean;
    fetchedQrCode: string | null;
    setVisibleComponent: (component: string) => void;
    backgroundColor?: string;
}

export function Jam({
    visible,
    fetchedQrCode,
    setVisibleComponent
}: JamProps) {
    if (!visible) return null;

    return (
        <div onClick={() => {
            setVisibleComponent('')
        }}>
            <div className="flex">
                <div className="w-[250px] h-[250px] shrink-0">
                    {fetchedQrCode === null ? (
                        <Icons.Loading className="w-full h-full object-cover rounded-lg animate-spin" />
                    ) : (
                        <img
                            src={fetchedQrCode || undefined}
                            className="w-full h-full object-cover rounded-lg"
                        />
                    )}
                </div>
                <div className="text-white max-w-[280px] mr-4 flex flex-col justify-center pl-5">
                    <h2 className="text-[40px] font-bold mb-4">Listen together</h2>
                    <p className="text-[25px] text-white/75">
                        Scan with the Spotify app to join this listening session.
                    </p>
                </div>
            </div>
        </div>
    );
}