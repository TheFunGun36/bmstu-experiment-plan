import { Box, TextField, Typography } from "@mui/material";
import { useState } from "react";

export interface FloatInputProps {
    label: string,
    errorText: string,
    valid: (v: number) => boolean,
    valConverted?: number,
    valHintText?: string,
    setVal: (v: number) => void,
}

function FloatInput({label, errorText, valid, setVal, valConverted, valHintText}: FloatInputProps) {
    const [valStr, setValStr] = useState('');
    const [valErr, setValErr] = useState(false);

    return (
      <Box>
        <TextField
          label={label}
          variant='standard'
          error={valErr}
          helperText={valErr && errorText}
          value={valStr}
          onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
            setValStr(ev.target.value);
            const n = Number(ev.target.value);
            setValErr(!valid(n));
            setVal(n);
          }}
        />
        {!valErr && valStr && valHintText && valConverted &&
          <Typography ml={1}>{valHintText}{valConverted.toFixed(4)}</Typography>}
      </Box>
    );
}

export default FloatInput;
