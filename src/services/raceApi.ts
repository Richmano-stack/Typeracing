export interface InitiateResponse {
    raceId: string;
    content: string;
}

export interface StartResponse {
    startTime: number;
}

export interface FinishResponse {
    wpm: number;
    accuracy: number;
    durationMs: number;
    saved: boolean;
    authenticated: boolean;
}

export const raceApi = {
    async initiate(): Promise<InitiateResponse> {
        const response = await fetch("/api/race/initiate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to initiate race: ${response.statusText} - ${errorText}`);
        }

        return response.json();
    },

    async start(raceId: string): Promise<StartResponse> {
        const response = await fetch("/api/race/start", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ raceId }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to start race: ${response.statusText} - ${errorText}`);
        }

        return response.json();
    },

    async finish(raceId: string, totalCharactersInserted: number): Promise<FinishResponse> {
        const response = await fetch("/api/race/finish", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ raceId, totalCharactersInserted }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to finish race: ${response.statusText} - ${errorText}`);
        }

        return response.json();
    },

    async ready(roomId: string, userId: string): Promise<{ roomId: string; room: any }> {
        const response = await fetch("/api/race/ready", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ roomId, userId }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to ready up: ${response.statusText} - ${errorText}`);
        }

        return response.json();
    },

    async startMultiplayer(roomId: string, userId: string): Promise<{ roomId: string; room: any }> {
        const response = await fetch("/api/race/start", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ roomId, userId }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to start multiplayer race: ${response.statusText} - ${errorText}`);
        }

        return response.json();
    },

async reset(roomId: string, userId: string): Promise<{ success: boolean; message: string }> {
        const response = await fetch("/api/race/reset", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ roomId, userId }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to reset room: ${response.statusText} - ${errorText}`);
        }

        return response.json();
    },

    async create(promptId?: string, promptText?: string): Promise<{ roomId: string; hostId: string; room: any }> {
        const response = await fetch("/api/race/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ promptId, promptText }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to create race: ${response.statusText} - ${errorText}`);
        }

        return response.json();
    }
};
