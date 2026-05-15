using System;
using UnityEngine;

public struct Pos3D
{
    public float x;
    public float y;
    public float z;

    public Pos3D(float x, float y, float z)
    {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}
public static class MathUtils
{
    public static float Distance(float x1, float y1, float z1, 
                              float x2, float y2, float z2)
    {
        float dx = x2 - x1, dy = y2 - y1, dz = z2 - z1;
        return MathF.Sqrt(dx * dx + dy * dy + dz * dz);
    }

    public static Vector3 ToVector3(this Pos3D p3D)
    {
        return new Vector3(p3D.x,p3D.y,p3D.z);
    }
}