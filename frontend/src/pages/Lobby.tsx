import { Card, CardContent, Typography, Box, Button, IconButton } from "@mui/material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

function Lobby({ 
    onCreateRoom,
    onEnterRoom,
    roomCode
}: {
    onCreateRoom: () => void; 
    onEnterRoom: (code: string) => void;
    roomCode: string;
}) {

    
    return (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Card sx={{ maxWidth: 500, minWidth: 400, width: "100%", mx: 2, bgcolor: "#4F46E5", color: "#fff", borderRadius: 2 }}>
                <CardContent>
                    <Button variant="contained" fullWidth onClick = { onCreateRoom } sx={{ bgcolor: "#6366F1", '&:hover': { bgcolor: '#3b34b3' }, fontWeight: "bold", py: 1.5, fontFamily: "Arial Black"}}>
                        Create Room
                    </Button>

        {roomCode && (
            <Box sx={{ mt: 3, p: 2, bgcolor: "#6366F1", borderRadius: 1, border: "1px dashed #000000", textAlign: "center", position: "relative" }}>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)", display: "block", mb: 0.5, textTransform: "uppercase" }}>
                    Your Room Code 
                </Typography>
        
                <Typography variant="h4" sx={{ fontWeight: "black", color: "#000000", letterSpacing: 4, mb: 2 }}>
                    {roomCode}
                </Typography>

                <Button 
                    variant="outlined"
                    fullWidth
                    sx={{
                        bgcolor: "#1619a6",
                        color: "#fff",
                        '&:hover': { bgcolor: '#3b34b3' }, 
                        fontWeight: "bold",
                        fontFamily: "Arial Black",
                        textTransform: "uppercase"
                    }}
                    onClick={() => onEnterRoom(roomCode)}
                >
                    Enter Match Room
                </Button>

                <IconButton 
                    onClick={() => navigator.clipboard.writeText(roomCode)}
                    sx={{
                        color: "#000000",
                        "&:hover": { bgcolor: "rgba(0, 0, 0, 0.1)" },
                        transition: "background-color 0.2s",
                        position: "absolute",
                        top: 8,
                        right: 8
                    }}
                    aria-label="copy room code"
                >
                    <ContentCopyIcon fontSize="small" />
                </IconButton>
            </Box>
        )}  
                </CardContent>
            </Card>
        </Box>
    )
}

export default Lobby;

