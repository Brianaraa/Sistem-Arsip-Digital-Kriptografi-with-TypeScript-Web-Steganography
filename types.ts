
export interface User {
    username: string;
    scryptHash: string;
}

export interface EvidenceRecord {
    id: number;
    created_at: string;
    agent_id: string; // Akan dienkripsi di DB
    case_title: string; // Akan dienkripsi di DB
    classification_level: string; // Akan dienkripsi di DB
    encrypted_description: string; // Double encryption: SuperEncrypt -> VigenereDB
    encrypted_file_b64: string | null; // Double encryption: RailFence -> VigenereDB
    file_name: string | null; // Akan dienkripsi di DB
    file_rail_key_hint: string | null; // Akan dienkripsi di DB
    stego_image_b64: string | null; // DataURL (Base64), Akan dienkripsi di DB
}

export type AuthMethod = 'PASSWORD' | 'WALLET';
