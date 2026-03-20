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
    }
};
